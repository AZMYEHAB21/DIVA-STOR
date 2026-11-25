(() => {
  "use strict";

  const config = window.DIVA_SUPABASE || {};
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const DEFAULT_HERO_TITLE = "كوني نجمتك الخاصة";
  const DEFAULT_HERO_SUBTITLE = "ملابس حريمي راقية وعصرية في المنصورة؛ أحدث صيحات الموضة بجودة عالية وأسعار عادلة، من الكاجوال المريح لحد إطلالات السهرة.";
  const isConfigured = Boolean(
    config.url && !config.url.startsWith("YOUR_") &&
    config.anonKey && !config.anonKey.startsWith("YOUR_") &&
    config.adminEmail && !config.adminEmail.startsWith("YOUR_")
  );

  if (!isConfigured) {
    const loginMessage = $("#loginMsg");
    if (loginMessage) loginMessage.textContent = "يجب ضبط بيانات Supabase داخل supabase-config.js قبل تسجيل الدخول.";
    const connection = $("#connectionState");
    if (connection) connection.textContent = "غير مربوط";
    const summary = $("#connectionSummary");
    if (summary) summary.textContent = "غير مربوط";
    return;
  }

  const db = window.supabase.createClient(config.url, config.anonKey);
  let siteImageCache = [];

  function toast(message) {
    const notice = document.createElement("div");
    notice.className = "toast";
    notice.setAttribute("role", "status");
    notice.textContent = message;
    document.body.append(notice);
    window.setTimeout(() => notice.remove(), 3800);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function isUsefulCopy(value, type = "subtitle") {
    const text = String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim();
    if (type === "title") {
      const arabicLetters = (text.match(/[\u0600-\u06FF]/g) || []).length;
      const words = text.split(/\s+/).filter(Boolean).length;
      return text.length >= 8 && (arabicLetters >= 3 || words >= 2);
    }
    const arabicLetters = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const words = text.split(/\s+/).filter(Boolean).length;
    return text.length >= 35 && (arabicLetters >= 12 || words >= 5);
  }

  function validImageURL(value) {
    try {
      const parsed = new URL(String(value || "").trim());
      return parsed.protocol === "https:" && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  function setConnectionState(label, connected = false) {
    const connection = $("#connectionState");
    const summary = $("#connectionSummary");
    if (connection) connection.textContent = label;
    if (summary) summary.textContent = connected ? "متصل" : label;
  }

  async function requireAuth() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
      if (!location.pathname.endsWith("admin-login.html")) location.href = "admin-login.html";
      return false;
    }
    if (location.pathname.endsWith("admin-login.html")) {
      location.href = "admin.html";
      return false;
    }
    return true;
  }

  const loginForm = $("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const username = String(formData.get("username") || "").trim();
      const password = String(formData.get("password") || "");
      const message = $("#loginMsg");
      const button = $("button[type='submit']", loginForm);

      if (username !== "admin.eg") {
        message.textContent = "اسم المستخدم غير صحيح.";
        return;
      }
      if (!password) {
        message.textContent = "اكتبي كلمة المرور أولاً.";
        return;
      }

      button.disabled = true;
      message.textContent = "جارٍ التحقق من بيانات الدخول...";
      const { error } = await db.auth.signInWithPassword({ email: config.adminEmail, password });
      button.disabled = false;
      message.textContent = error ? "تعذر تسجيل الدخول. راجعي البيانات وحاولي مرة أخرى." : "";
      if (!error) location.href = "admin.html";
    });
  }

  const logoutButton = $("#logoutBtn");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      const { error } = await db.auth.signOut();
      if (error) {
        logoutButton.disabled = false;
        toast("تعذر تسجيل الخروج. حاولي مرة أخرى.");
        return;
      }
      location.href = "admin-login.html";
    });
  }

  if (!$("#offerForm") && !$("#siteImageForm") && !$("#settingsForm")) return;

  requireAuth().then((authenticated) => {
    if (authenticated) initDashboard();
  }).catch((error) => {
    console.error("DIVA admin: authentication check failed", error);
    setConnectionState("تعذر التحقق");
    toast("تعذر التحقق من جلسة الإدارة. حدّثي الصفحة وحاولي مرة أخرى.");
  });

  async function initDashboard() {
    setConnectionState("متصل", true);
    setupTabs();
    setupSidebar();
    await seedBundledImages();
    await Promise.all([loadOffers(), loadSiteImages(), loadSettings()]);
    setupOfferForm();
    setupImageForm();
    setupSettingsForm();
  }

  function setupTabs() {
    $$(".tab[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".tab[data-tab]").forEach((tab) => {
          const active = tab === button;
          tab.classList.toggle("active", active);
          tab.setAttribute("aria-current", active ? "page" : "false");
        });
        $$(".panel").forEach((panel) => {
          panel.classList.toggle("active", panel.id === `tab-${button.dataset.tab}`);
        });
        closeSidebar();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function setupSidebar() {
    const sidebar = $("#adminSidebar");
    const toggle = $("#sidebarToggle");
    const scrim = $("#sidebarScrim");
    if (!sidebar || !toggle || !scrim) return;

    const openSidebar = () => {
      sidebar.classList.add("is-open");
      scrim.classList.add("is-visible");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("sidebar-open");
    };
    toggle.addEventListener("click", () => {
      if (sidebar.classList.contains("is-open")) closeSidebar();
      else openSidebar();
    });
    scrim.addEventListener("click", closeSidebar);
    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) closeSidebar();
    });
  }

  function closeSidebar() {
    const sidebar = $("#adminSidebar");
    const toggle = $("#sidebarToggle");
    const scrim = $("#sidebarScrim");
    sidebar?.classList.remove("is-open");
    scrim?.classList.remove("is-visible");
    toggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sidebar-open");
  }

  function setupOfferForm() {
    const form = $("#offerForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = $("button[type='submit']", form);
      submitButton.disabled = true;
      const data = new FormData(form);
      const id = String(data.get("id") || "");
      const row = {
        title: String(data.get("title") || "").trim(),
        badge: String(data.get("badge") || "").trim(),
        description: String(data.get("description") || "").trim(),
        date_label: String(data.get("date_label") || "").trim(),
        icon: String(data.get("icon") || "fa-bag-shopping").trim(),
        sort_order: Number(data.get("sort_order") || 0),
        active: form.elements.active.checked
      };
      const result = id
        ? await db.from("diva_offers").update(row).eq("id", id)
        : await db.from("diva_offers").insert(row);
      submitButton.disabled = false;
      if (result.error) return toast(`تعذر حفظ العرض: ${result.error.message}`);

      form.reset();
      form.elements.sort_order.value = "0";
      form.elements.icon.value = "fa-bag-shopping";
      form.elements.active.checked = true;
      form.elements.id.value = "";
      toast("تم حفظ العرض بنجاح.");
      await loadOffers();
    });

    $("#clearOffer")?.addEventListener("click", () => {
      window.setTimeout(() => {
        form.elements.id.value = "";
        form.elements.icon.value = "fa-bag-shopping";
        form.elements.sort_order.value = "0";
        form.elements.active.checked = true;
      }, 0);
    });
  }

  function setupImageForm() {
    const form = $("#siteImageForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = $("button[type='submit']", form);
      submitButton.disabled = true;
      const formData = new FormData(form);
      const id = String(formData.get("id") || "");
      const file = form.elements.image.files[0];
      const current = siteImageCache.find((image) => image.id === id);
      let imageURL = current?.image_url || "";
      let storagePath = current?.storage_path || null;

      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          submitButton.disabled = false;
          return toast("حجم الصورة أكبر من 10 ميجابايت.");
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          submitButton.disabled = false;
          return toast("الصيغ المسموحة هي JPG وPNG وWEBP فقط.");
        }
        const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
        const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const path = `site-images/${safeName}`;
        const upload = await db.storage.from("diva-media").upload(path, file, {
          upsert: false,
          contentType: file.type
        });
        if (upload.error) {
          submitButton.disabled = false;
          return toast(`فشل رفع الصورة: ${upload.error.message}`);
        }
        imageURL = db.storage.from("diva-media").getPublicUrl(path).data.publicUrl;
        storagePath = path;
      }

      if (!imageURL) {
        submitButton.disabled = false;
        return toast("اختاري صورة من جهازك أولاً.");
      }

      const placement = form.elements.placement.value;
      const row = {
        title: String(formData.get("title") || "").trim(),
        category: String(formData.get("category") || "").trim(),
        alt_text: String(formData.get("alt_text") || formData.get("title") || "").trim(),
        image_url: imageURL,
        storage_path: storagePath,
        active: form.elements.active.checked,
        show_in_gallery: placement !== "home",
        show_on_home: placement !== "gallery",
        updated_at: new Date().toISOString()
      };
      if (!row.category) {
        submitButton.disabled = false;
        return toast("اكتبي تصنيف الصورة.");
      }

      let result;
      if (id) {
        result = await db.from("diva_site_images").update(row).eq("id", id);
      } else {
        const { data: latest } = await db.from("diva_site_images")
          .select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
        row.sort_order = Number(latest?.sort_order || 0) + 1;
        result = await db.from("diva_site_images").insert(row);
      }

      if (result.error) {
        if (file && storagePath) await db.storage.from("diva-media").remove([storagePath]);
        submitButton.disabled = false;
        return toast(`تعذر حفظ الصورة: ${result.error.message}`);
      }

      if (file && current?.storage_path && current.storage_path !== storagePath) {
        const removal = await db.storage.from("diva-media").remove([current.storage_path]);
        if (removal.error) console.warn("DIVA: previous image could not be removed from storage", removal.error);
      }

      form.reset();
      form.elements.id.value = "";
      form.elements.active.checked = true;
      form.elements.placement.value = "gallery";
      submitButton.disabled = false;
      toast("تم حفظ الصورة بنجاح.");
      await loadSiteImages();
    });

    $("#clearSiteImage")?.addEventListener("click", () => {
      window.setTimeout(() => {
        form.elements.id.value = "";
        form.elements.active.checked = true;
        form.elements.placement.value = "gallery";
      }, 0);
    });
  }

  function setupSettingsForm() {
    const form = $("#settingsForm");
    if (!form) return;

    const previewTitle = $("#heroPreviewTitle");
    const previewSubtitle = $("#heroPreviewSubtitle");
    const updatePreview = () => {
      if (previewTitle) previewTitle.textContent = form.elements.hero_title.value.trim() || DEFAULT_HERO_TITLE;
      if (previewSubtitle) previewSubtitle.textContent = isUsefulCopy(form.elements.hero_subtitle.value)
        ? form.elements.hero_subtitle.value.trim()
        : DEFAULT_HERO_SUBTITLE;
    };
    form.addEventListener("input", updatePreview);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = {
        hero_title: form.elements.hero_title.value.trim(),
        hero_subtitle: form.elements.hero_subtitle.value.trim(),
        hero_image: form.elements.hero_image.value.trim()
      };
      if (values.hero_title && !isUsefulCopy(values.hero_title, "title")) {
        return toast("العنوان قصير أو غير واضح. اكتبي عنوانًا مفهومًا قبل الحفظ.");
      }
      if (values.hero_subtitle && !isUsefulCopy(values.hero_subtitle)) {
        return toast("الوصف قصير أو غير مفهوم. اكتبي وصفًا واضحًا للزوار قبل الحفظ.");
      }
      if (values.hero_image && !validImageURL(values.hero_image)) {
        return toast("رابط الصورة يجب أن يكون رابط HTTPS مباشرًا.");
      }

      const button = $("button[type='submit']", form);
      button.disabled = true;
      for (const [key, value] of Object.entries(values)) {
        const result = value
          ? await db.from("diva_settings").upsert({ key, value, updated_at: new Date().toISOString() })
          : await db.from("diva_settings").delete().eq("key", key);
        if (result.error) {
          button.disabled = false;
          return toast(`تعذر تحديث إعداد ${key}: ${result.error.message}`);
        }
      }
      button.disabled = false;
      toast("تم تحديث محتوى الرئيسية وحذف أي قيم تم تفريغها.");
      await loadSettings();
      updatePreview();
    });
  }

  async function seedBundledImages() {
    const status = $("#bulkImportStatus");
    const bundledImages = (window.DIVA_IMAGE_LIBRARY || []).map((image) => ({
      ...image,
      active: true,
      storage_path: null
    }));
    if (!bundledImages.length) return;

    const { data: existing, error: readError } = await db.from("diva_site_images").select("image_key");
    if (readError) {
      if (status) status.textContent = `تعذرت مزامنة المكتبة: ${readError.message}`;
      return;
    }

    const existingKeys = new Set((existing || []).map((row) => row.image_key).filter(Boolean));
    const missingImages = bundledImages.filter((image) => !existingKeys.has(image.image_key));
    if (!missingImages.length) {
      if (status) status.textContent = "كل الصور الأصلية موجودة بالفعل في مكتبة الإدارة.";
      return;
    }

    const { data: latest } = await db.from("diva_site_images")
      .select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    let order = Number(latest?.sort_order || 0);
    const rows = missingImages.map((image) => ({
      ...image,
      active: true,
      storage_path: null,
      sort_order: ++order
    }));
    const { error } = await db.from("diva_site_images").insert(rows);
    if (error) {
      if (status) status.textContent = `تعذرت إضافة الصور تلقائيًا: ${error.message}`;
      return;
    }
    if (status) status.textContent = `تمت إضافة ${rows.length} صورة إلى المكتبة دون تعديل الصور الموجودة.`;
  }

  async function loadOffers() {
    const { data, error } = await db.from("diva_offers").select("*").order("sort_order");
    if (error) {
      $("#offersList").innerHTML = '<div class="empty">تعذر تحميل العروض. راجعي اتصال Supabase وصلاحيات الإدارة.</div>';
      return toast(`تعذر تحميل العروض: ${error.message}`);
    }

    const offers = data || [];
    const count = $("#offerCount");
    if (count) count.textContent = String(offers.filter((offer) => offer.active).length);
    const list = $("#offersList");
    list.innerHTML = offers.map((offer) => `
      <article class="manage-item">
        <div>
          <h3>${escapeHTML(offer.title)} <span>·</span> ${escapeHTML(offer.badge)}</h3>
          <p>${escapeHTML(offer.description)} · ${offer.active ? "منشور على الموقع" : "محفوظ وغير منشور"}</p>
        </div>
        <div class="item-actions">
          <button type="button" data-edit-offer="${escapeHTML(offer.id)}">تعديل</button>
          <button type="button" class="danger" data-delete-offer="${escapeHTML(offer.id)}">حذف</button>
        </div>
      </article>`).join("") || '<div class="empty">لا توجد عروض حتى الآن. أضيفي أول عرض من النموذج أعلاه.</div>';

    $$('[data-edit-offer]', list).forEach((button) => {
      button.addEventListener("click", () => {
        const offer = offers.find((item) => String(item.id) === button.dataset.editOffer);
        const form = $("#offerForm");
        if (!offer || !form) return;
        Object.keys(offer).forEach((key) => {
          const field = form.elements[key];
          if (!field) return;
          if (field.type === "checkbox") field.checked = Boolean(offer[key]);
          else field.value = offer[key] ?? "";
        });
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    $$('[data-delete-offer]', list).forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm("هل تريدين حذف هذا العرض نهائيًا؟")) return;
        button.disabled = true;
        const { error: deleteError } = await db.from("diva_offers").delete().eq("id", button.dataset.deleteOffer);
        if (deleteError) {
          button.disabled = false;
          return toast(`تعذر حذف العرض: ${deleteError.message}`);
        }
        toast("تم حذف العرض.");
        await loadOffers();
      });
    });
  }

  async function loadSiteImages() {
    const { data, error } = await db.from("diva_site_images").select("*").order("sort_order");
    if (error) {
      const list = $("#siteImagesList");
      if (list) list.innerHTML = '<div class="empty">تعذر قراءة صور الموقع. تأكدي من تشغيل ملف site-images-migration.sql في Supabase.</div>';
      const count = $("#galleryCount");
      if (count) count.textContent = "—";
      return;
    }

    siteImageCache = data || [];
    const count = $("#galleryCount");
    if (count) count.textContent = String(siteImageCache.filter((image) => image.active && image.show_in_gallery).length);

    const list = $("#siteImagesList");
    if (!list) return;
    list.innerHTML = siteImageCache.map((image) => {
      const placement = image.show_on_home
        ? (image.show_in_gallery ? "الرئيسية والمعرض" : "الرئيسية فقط")
        : (image.show_in_gallery ? "المعرض فقط" : "غير معروضة");
      return `
        <article class="manage-item">
          <img class="thumb" src="${escapeHTML(image.image_url)}" alt="${escapeHTML(image.alt_text || image.title)}" loading="lazy">
          <div>
            <h3>${escapeHTML(image.title)}</h3>
            <p>${escapeHTML(image.category)} · ${placement} · ${image.active ? "ظاهرة" : "مخفية"}</p>
          </div>
          <div class="item-actions">
            <button type="button" data-edit-site-image="${escapeHTML(image.id)}">تعديل</button>
            <button type="button" class="danger" data-delete-site-image="${escapeHTML(image.id)}">حذف</button>
          </div>
        </article>`;
    }).join("") || '<div class="empty">مكتبة الصور فارغة. أضيفي أول صورة من النموذج.</div>';

    $$('[data-edit-site-image]', list).forEach((button) => {
      button.addEventListener("click", () => {
        const image = siteImageCache.find((item) => String(item.id) === button.dataset.editSiteImage);
        const form = $("#siteImageForm");
        if (!image || !form) return;
        form.elements.id.value = image.id;
        form.elements.title.value = image.title || "";
        form.elements.category.value = image.category || "";
        form.elements.alt_text.value = image.alt_text || "";
        form.elements.active.checked = Boolean(image.active);
        form.elements.placement.value = image.show_on_home
          ? (image.show_in_gallery ? "both" : "home")
          : "gallery";
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    $$('[data-delete-site-image]', list).forEach((button) => {
      button.addEventListener("click", async () => {
        const image = siteImageCache.find((item) => String(item.id) === button.dataset.deleteSiteImage);
        if (!image || !window.confirm("هل تريدين حذف الصورة نهائيًا من الموقع والتخزين؟")) return;
        button.disabled = true;
        if (image.storage_path) {
          const removal = await db.storage.from("diva-media").remove([image.storage_path]);
          if (removal.error) {
            button.disabled = false;
            return toast(`تعذر حذف ملف الصورة: ${removal.error.message}`);
          }
        }
        const { error: deleteError } = await db.from("diva_site_images").delete().eq("id", image.id);
        if (deleteError) {
          button.disabled = false;
          return toast(`تعذر حذف سجل الصورة: ${deleteError.message}`);
        }
        toast("تم حذف الصورة بنجاح.");
        await loadSiteImages();
      });
    });
  }

  async function loadSettings() {
    const form = $("#settingsForm");
    if (!form) return;
    const notice = $("#settingsQualityNotice");
    form.elements.hero_title.value = DEFAULT_HERO_TITLE;
    form.elements.hero_subtitle.value = DEFAULT_HERO_SUBTITLE;
    form.elements.hero_image.value = "";
    const { data, error } = await db.from("diva_settings").select("*");
    if (error) {
      if (notice) {
        notice.hidden = false;
        notice.textContent = "تعذر قراءة إعدادات الرئيسية من قاعدة البيانات. ستظهر القيم الافتراضية حتى يتم الاتصال.";
      }
      return;
    }

    let invalidSavedCopy = false;
    (data || []).forEach((setting) => {
      const field = form.elements[setting.key];
      if (!field) return;
      const value = String(setting.value || "").trim();
      if (setting.key === "hero_title") {
        if (isUsefulCopy(value, "title")) field.value = value;
        else if (value) invalidSavedCopy = true;
      } else if (setting.key === "hero_subtitle") {
        if (isUsefulCopy(value)) field.value = value;
        else if (value) invalidSavedCopy = true;
      } else if (setting.key === "hero_image") {
        if (validImageURL(value)) field.value = value;
        else if (value) invalidSavedCopy = true;
      }
    });

    if (!form.elements.hero_title.value) form.elements.hero_title.value = DEFAULT_HERO_TITLE;
    if (!form.elements.hero_subtitle.value) form.elements.hero_subtitle.value = DEFAULT_HERO_SUBTITLE;
    if (notice && invalidSavedCopy) {
      notice.hidden = false;
      notice.textContent = "تم تجاهل قيمة محفوظة غير صالحة أو غير مفهومة، لذلك ستظهر الصياغة الافتراضية للزوار. احفظي النص الصحيح من النموذج لتحديث القيمة المحفوظة.";
    }

    const previewTitle = $("#heroPreviewTitle");
    const previewSubtitle = $("#heroPreviewSubtitle");
    if (previewTitle) previewTitle.textContent = form.elements.hero_title.value;
    if (previewSubtitle) previewSubtitle.textContent = form.elements.hero_subtitle.value;
    renderSavedSettings(data || []);
  }

  function renderSavedSettings(settings) {
    const container = $("#savedSettingsList");
    if (!container) return;
    if (!settings.length) {
      container.innerHTML = '<div class="empty">لا توجد إعدادات محفوظة حاليًا.</div>';
      return;
    }
    container.innerHTML = settings.map((item) => `
      <article class="manage-item saved-setting-item">
        <div class="saved-setting-copy"><h3>${escapeHTML(item.key)}</h3><p dir="auto">${escapeHTML(item.value)}</p></div>
        <div class="item-actions"><button class="danger" type="button" data-delete-setting="${escapeHTML(item.key)}">حذف القيمة</button></div>
      </article>`).join("");
    container.querySelectorAll("[data-delete-setting]").forEach((button) => {
      button.addEventListener("click", async () => {
        const key = button.dataset.deleteSetting;
        if (!window.confirm(`هل تريد حذف الإعداد المحفوظ «${key}» نهائيًا؟`)) return;
        button.disabled = true;
        const { error } = await db.from("diva_settings").delete().eq("key", key);
        if (error) {
          button.disabled = false;
          return toast(`تعذر حذف الإعداد: ${error.message}`);
        }
        toast(`تم حذف الإعداد ${key}.`);
        await loadSettings();
      });
    });
  }
})();
