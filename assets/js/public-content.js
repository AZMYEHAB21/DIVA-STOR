(() => {
  "use strict";

  const config = window.DIVA_SUPABASE || {};
  const localImages = Array.isArray(window.DIVA_IMAGE_LIBRARY)
    ? window.DIVA_IMAGE_LIBRARY.map((image) => ({ ...image, active: true }))
    : [];

  const hasSupabaseConfig = () => Boolean(
    window.supabase &&
    config.url && !config.url.startsWith("YOUR_") &&
    config.anonKey && !config.anonKey.startsWith("YOUR_")
  );

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  function createImage(item, { eager = false, className = "" } = {}) {
    const image = new Image();
    image.alt = item.alt_text || item.title || "DIVA";
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    image.draggable = false;
    if (className) image.className = className;
    if (eager) image.fetchPriority = "high";

    const itemKeyNumber = String(item.image_key || "").match(/(\d{1,2})$/)?.[1];
    const localFallback = localImages.find((candidate) =>
      (item.image_key && candidate.image_key === item.image_key) ||
      (itemKeyNumber && candidate.image_key.endsWith(`-${itemKeyNumber.padStart(2, "0")}`)) ||
      (item.title && candidate.title === item.title)
    );
    const primarySource = String(item.image_url || "").trim();
    const fallbackSource = localFallback?.image_url || "";
    const useFallback = () => {
      if (fallbackSource && image.dataset.fallbackApplied !== "true" && image.src !== new URL(fallbackSource, document.baseURI).href) {
        image.dataset.fallbackApplied = "true";
        image.src = fallbackSource;
        return;
      }
      image.classList.add("image-unavailable");
      image.removeAttribute("src");
      image.closest(".hv, .g-item, .r-card")?.classList.add("image-failed");
    };

    image.addEventListener("error", useFallback);
    image.src = primarySource || fallbackSource;
    if (!primarySource && !fallbackSource) useFallback();
    return image;
  }

  function createCaption(item, compact = false) {
    const caption = createElement("div", "cap");
    const title = createElement("b", "", item.title || "DIVA");
    const tag = createElement("span", "tag", item.category || "تشكيلة DIVA");
    caption.append(title, tag);
    if (compact) caption.classList.add("cap-compact");
    return caption;
  }

  function renderHero(images) {
    const wall = document.getElementById("heroImageWall");
    if (!wall) return;

    const badge = wall.querySelector(".spin-badge");
    wall.querySelectorAll(".hv").forEach((frame) => frame.remove());

    const heroPriority = ["diva-look-07", "diva-look-11", "diva-look-05", "diva-look-02", "diva-look-01"];
    const databaseFeatured = (images || []).filter((image) =>
      image.show_on_home && !/^look-\d+$/.test(image.image_key || "")
    );
    const databaseKeys = new Set(databaseFeatured.map((image) => image.image_key).filter(Boolean));
    const localBackups = localImages.filter((image) =>
      image.show_on_home && !databaseKeys.has(image.image_key)
    );
    const featured = [...databaseFeatured, ...localBackups].sort((a, b) => {
      const aIndex = heroPriority.indexOf(a.image_key);
      const bIndex = heroPriority.indexOf(b.image_key);
      return (aIndex < 0 ? 100 : aIndex) - (bIndex < 0 ? 100 : bIndex)
        || Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });
    featured.slice(0, 3).forEach((item, index) => {
      const frame = createElement("figure", `hv hv-${index + 1}`);
      frame.setAttribute("aria-label", item.title || "صورة من تشكيلة DIVA");
      const image = createImage(item, { eager: true });
      const label = createElement("figcaption", "hv-label", item.title || "DIVA");
      frame.append(image, label);
      if (badge) wall.insertBefore(frame, badge);
      else wall.append(frame);
    });
  }

  function renderHomeRail(images) {
    const rail = document.querySelector("[data-rail]");
    if (!rail) return;

    rail.replaceChildren();
    const featured = images.filter((image) => image.show_on_home);
    const modernFeatured = featured.filter((image) => !/^look-\d+$/.test(image.image_key || ""));
    const visibleFeatured = modernFeatured.length ? modernFeatured : featured;
    visibleFeatured.forEach((item) => {
      const link = createElement("a", "r-card");
      const query = new URLSearchParams({ filter: item.category || "all" });
      link.href = `gallery.html?${query.toString()}`;
      link.setAttribute("aria-label", `عرض ${item.title || "صورة"} في المعرض`);
      link.draggable = false;
      link.append(createImage(item), createCaption(item));
      rail.append(link);
    });
  }

  function renderCategoryImages(images) {
    const byKey = new Map(images.filter((image) => image.image_key).map((image) => [image.image_key, image]));

    document.querySelectorAll("[data-site-image-bg]").forEach((element) => {
      const item = byKey.get(element.dataset.siteImageBg);
      if (!item || !item.show_on_home) {
        element.hidden = true;
        return;
      }
      element.hidden = false;
      element.dataset.img = item.image_url;
    });
  }

  function renderGallery(images) {
    const grid = document.querySelector(".g-grid");
    if (!grid) return;

    const galleryImages = images
      .filter((image) => image.show_in_gallery)
      .sort((a, b) => {
        const aLegacy = /^look-\d+$/.test(a.image_key || "");
        const bLegacy = /^look-\d+$/.test(b.image_key || "");
        return Number(aLegacy) - Number(bLegacy)
          || Number(a.sort_order || 0) - Number(b.sort_order || 0);
      });
    grid.replaceChildren();

    galleryImages.forEach((item) => {
      const card = createElement("button", "g-item");
      card.type = "button";
      card.dataset.category = item.category || "عام";
      card.setAttribute("aria-label", `عرض صورة: ${item.title || "DIVA"}`);
      card.append(createImage(item));

      const zoom = createElement("span", "zoom");
      zoom.setAttribute("aria-hidden", "true");
      const icon = createElement("i");
      icon.className = "fa-solid fa-expand";
      zoom.append(icon);

      card.append(zoom, createCaption(item));
      grid.append(card);
    });

    const pills = document.querySelector(".pills");
    if (pills) {
      const categories = [...new Set(galleryImages.map((image) => image.category).filter(Boolean))];
      const buttons = [
        { value: "all", label: "الكل" },
        ...categories.map((category) => ({ value: category, label: category }))
      ];
      pills.replaceChildren();
      const slider = createElement("span", "slider");
      slider.setAttribute("aria-hidden", "true");
      pills.append(slider);

      buttons.forEach(({ value, label }, index) => {
        const button = createElement("button", `pill${index === 0 ? " active" : ""}`, label);
        button.type = "button";
        button.dataset.filter = value;
        button.setAttribute("aria-pressed", String(index === 0));
        pills.append(button);
      });
    }

    const count = document.getElementById("gCount");
    if (count) count.textContent = String(galleryImages.length);
  }

  function renderOffers(offers, error = null) {
    const grid = document.getElementById("offersGrid");
    if (!grid) return;

    const stage = document.getElementById("offersStage");
    const emptyState = document.getElementById("noOffersMessage");

    grid.replaceChildren();
    (offers || []).forEach((offer) => {
      const card = createElement("article", "o-card");
      const badge = createElement("span", "o-badge", offer.badge || "DIVA");
      const iconWrap = createElement("div", "o-ico");
      const icon = createElement("i");
      icon.className = `fa-solid ${offer.icon || "fa-bag-shopping"}`;
      iconWrap.append(icon);
      const title = createElement("h3", "", offer.title || "عرض DIVA");
      const description = createElement("p", "", offer.description || "");
      const date = createElement("span", "o-date", offer.date_label || "");
      const dateIcon = createElement("i");
      dateIcon.className = "fa-regular fa-calendar";
      date.prepend(dateIcon, document.createTextNode(" "));
      card.append(badge, iconWrap, title, description, date);
      grid.append(card);
    });

    const hasOffers = Boolean(offers && offers.length && !error);
    if (stage) stage.classList.toggle("is-locked", !hasOffers);
    if (emptyState) {
      emptyState.hidden = hasOffers;
      const heading = emptyState.querySelector("h2");
      const paragraph = emptyState.querySelector("p");
      if (heading) heading.textContent = error ? "العروض غير متاحة حالياً" : "لا توجد عروض متاحة الآن";
      if (paragraph) paragraph.textContent = error
        ? "تعذر الاتصال بخدمة العروض. يمكنك تصفح بقية الموقع والتواصل معنا عبر واتساب."
        : "نعتذر عن عدم توفر عروض حالياً.";
    }
  }

  function isUsefulPublicCopy(value, type = "subtitle") {
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

  function isSafeImageURL(value) {
    try {
      const parsed = new URL(String(value || "").trim(), document.baseURI);
      return (parsed.protocol === "https:" || parsed.origin === location.origin) && Boolean(parsed.pathname);
    } catch {
      return false;
    }
  }

  function applySettings(settings) {
    (settings || []).forEach((setting) => {
      if (setting.key === "hero_title" && isUsefulPublicCopy(setting.value, "title")) {
        const title = document.querySelector("[data-cms-hero-title]");
        if (title) title.textContent = String(setting.value).trim();
      }

      if (setting.key === "hero_subtitle" && isUsefulPublicCopy(setting.value)) {
        const subtitle = document.querySelector("[data-cms-hero-subtitle]");
        if (subtitle) subtitle.textContent = String(setting.value).trim();
      }

      if (setting.key === "hero_image" && isSafeImageURL(setting.value)) {
        const image = document.querySelector("#heroImageWall .hv img");
        if (image) image.src = String(setting.value).trim();
      }
    });
  }

  function renderSite(images, offers = [], settings = []) {
    const sortedImages = [...(images || [])].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    const imagesByKey = new Map(sortedImages.filter((image) => image.image_key).map((image) => [image.image_key, image]));

    document.querySelectorAll("img[data-site-image]").forEach((image) => {
      const item = imagesByKey.get(image.dataset.siteImage);
      const holder = image.closest(".story-img") || image;
      if (!item) {
        holder.hidden = true;
        return;
      }
      holder.hidden = false;
      image.hidden = false;
      image.src = item.image_url;
      image.alt = item.alt_text || item.title || "DIVA";
    });

    renderHero(sortedImages);
    renderHomeRail(sortedImages);
    renderCategoryImages(sortedImages);
    renderGallery(sortedImages);
    renderOffers(offers);
    applySettings(settings);
  }

  async function loadFromSupabase() {
    const client = window.supabase.createClient(config.url, config.anonKey);
    const [imagesResult, offersResult, settingsResult] = await Promise.all([
      client.from("diva_site_images").select("*").eq("active", true).order("sort_order"),
      document.getElementById("offersGrid")
        ? client.from("diva_offers").select("*").eq("active", true).order("sort_order")
        : Promise.resolve({ data: [], error: null }),
      document.querySelector("[data-cms-hero-title]")
        ? client.from("diva_settings").select("*")
        : Promise.resolve({ data: [], error: null })
    ]);

    if (imagesResult.error) {
      console.warn("DIVA: تعذر تحميل صور Supabase، سيتم استخدام الصور المحلية.", imagesResult.error);
      renderSite(localImages, offersResult.data || [], settingsResult.data || []);
    } else {
      renderSite(imagesResult.data || [], offersResult.data || [], settingsResult.data || []);
    }

    if (offersResult.error) renderOffers([], offersResult.error);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!hasSupabaseConfig()) {
      renderSite(localImages);
      return;
    }

    loadFromSupabase().catch((error) => {
      console.error("DIVA: تعذر تحميل المحتوى الديناميكي.", error);
      renderSite(localImages);
      renderOffers([], error);
    });
  });
})();
