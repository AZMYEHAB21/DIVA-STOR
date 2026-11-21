(()=>{
 const cfg=window.DIVA_SUPABASE||{}, $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
 const configured=cfg.url&&!cfg.url.startsWith("YOUR_")&&cfg.anonKey&&!cfg.anonKey.startsWith("YOUR_")&&cfg.adminEmail&&!cfg.adminEmail.startsWith("YOUR_");
 if(!configured){const m=$("#loginMsg");if(m)m.textContent="يجب أولاً ضبط بيانات Supabase داخل supabase-config.js حسب ملف تعليمات الربط.";const st=$("#connectionState");if(st)st.textContent="غير مربوط";return;}
 const db=window.supabase.createClient(cfg.url,cfg.anonKey);
 const toast=t=>{let x=document.createElement("div");x.className="toast";x.textContent=t;document.body.append(x);setTimeout(()=>x.remove(),3200)};
 async function requireAuth(){const {data:{session}}=await db.auth.getSession();if(!session){if(!location.pathname.endsWith("admin-login.html"))location.href="admin-login.html";return false;}if(location.pathname.endsWith("admin-login.html"))location.href="admin.html";return true;}
 const login=$("#loginForm");
 if(login)login.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(login),u=String(f.get("username")).trim(),p=String(f.get("password"));const msg=$("#loginMsg");if(u!=="admin.eg"){msg.textContent="اسم المستخدم غير صحيح.";return;}const btn=$("button",login);btn.disabled=true;msg.textContent="جارٍ التحقق...";const {error}=await db.auth.signInWithPassword({email:cfg.adminEmail,password:p});btn.disabled=false;msg.textContent=error?"تعذر تسجيل الدخول. راجع البيانات وحاول مرة أخرى.":"";if(!error)location.href="admin.html";});
 const logout=$("#logoutBtn");
 if(logout)logout.addEventListener("click",async()=>{await db.auth.signOut();location.href="admin-login.html";});
 if(!$("#offerForm")&&!$("#siteImageForm")&&!$("#settingsForm"))return;
 requireAuth().then(ok=>{if(ok)initDashboard();});
 async function initDashboard(){
  $("#connectionState").textContent="متصل";
  $$(".tab").forEach(b=>b.addEventListener("click",()=>{$$(".tab").forEach(x=>x.classList.toggle("active",x===b));$$(".panel").forEach(x=>x.classList.toggle("active",x.id==="tab-"+b.dataset.tab));}));
  await seedBundledImages();
  await Promise.all([loadOffers(),loadSiteImages(),loadSettings()]);
  const of=$("#offerForm");of.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(of),id=f.get("id");const row={title:f.get("title").trim(),badge:f.get("badge").trim(),description:f.get("description").trim(),date_label:f.get("date_label").trim(),icon:(f.get("icon")||"fa-bag-shopping").trim(),sort_order:Number(f.get("sort_order")||0),active:of.elements.active.checked};const res=id?await db.from("diva_offers").update(row).eq("id",id):await db.from("diva_offers").insert(row);if(res.error)return toast("تعذر الحفظ: "+res.error.message);of.reset();of.elements.sort_order.value=0;of.elements.icon.value="fa-bag-shopping";of.elements.active.checked=true;of.elements.id.value="";toast("تم حفظ العرض");loadOffers();});
  $("#clearOffer").addEventListener("click",()=>setTimeout(()=>{of.elements.id.value="";of.elements.icon.value="fa-bag-shopping";of.elements.sort_order.value=0;},0));
  const sif=$("#siteImageForm");
  sif.addEventListener("submit",async e=>{
   e.preventDefault();const f=new FormData(sif),id=String(f.get("id")||""),file=sif.elements.image.files[0];
   let current=siteImageCache.find(x=>x.id===id),image_url=current?.image_url||"",storage_path=current?.storage_path||null;
   if(file){if(file.size>10*1024*1024)return toast("حجم الصورة أكبر من 10 ميجابايت");if(!["image/jpeg","image/png","image/webp"].includes(file.type))return toast("الصيغ المسموحة JPG وPNG وWEBP فقط");const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),path=`site-images/${Date.now()}-${crypto.randomUUID()}.${ext}`;const up=await db.storage.from("diva-media").upload(path,file,{upsert:false,contentType:file.type});if(up.error)return toast("فشل رفع الصورة: "+up.error.message);image_url=db.storage.from("diva-media").getPublicUrl(path).data.publicUrl;storage_path=path;}
   if(!image_url)return toast("اختار صورة من جهازك أولاً");
   const placement=sif.elements.placement.value;
   const row={title:String(f.get("title")).trim(),category:String(f.get("category")).trim(),alt_text:String(f.get("alt_text")||f.get("title")).trim(),image_url,storage_path,active:sif.elements.active.checked,show_in_gallery:placement!=="home",show_on_home:placement!=="gallery",updated_at:new Date().toISOString()};
   if(!row.category)return toast("اكتب تصنيف الصورة");
   let res;if(id)res=await db.from("diva_site_images").update(row).eq("id",id);else{const {data:latest}=await db.from("diva_site_images").select("sort_order").order("sort_order",{ascending:false}).limit(1).maybeSingle();row.sort_order=Number(latest?.sort_order||0)+1;res=await db.from("diva_site_images").insert(row);}
   if(res.error){if(file&&storage_path)await db.storage.from("diva-media").remove([storage_path]);return toast("تعذر حفظ الصورة: "+res.error.message);}
   if(file&&current?.storage_path&&current.storage_path!==storage_path)await db.storage.from("diva-media").remove([current.storage_path]);
   sif.reset();sif.elements.id.value="";sif.elements.active.checked=true;sif.elements.placement.value="gallery";toast("تم حفظ الصورة بنجاح");await loadSiteImages();
  });
  $("#clearSiteImage").addEventListener("click",()=>setTimeout(()=>{sif.elements.id.value="";sif.elements.active.checked=true;sif.elements.placement.value="gallery";},0));
  $("#settingsForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);for(const key of ["hero_title","hero_subtitle","hero_image"]){const value=String(f.get(key)||"").trim();if(value){const {error}=await db.from("diva_settings").upsert({key,value,updated_at:new Date().toISOString()});if(error)return toast("تعذر حفظ الإعدادات: "+error.message);}}toast("تم حفظ إعدادات الصفحة الرئيسية");});
 }
 async function seedBundledImages(){
  const status=$("#bulkImportStatus");
  const bundled=[
   {image_key:"diva-look-01",title:"هودي مطبوع",category:"هوديز",alt_text:"هودي مطبوع بألوان هادئة",image_url:"images/products/diva-look-01.jpg",show_on_home:true,show_in_gallery:true},
   {image_key:"diva-look-02",title:"هودي وردي بطباعة",category:"هوديز",alt_text:"هودي وردي بتصميم مطبوع",image_url:"images/products/diva-look-02.jpg",show_on_home:true,show_in_gallery:true},
   {image_key:"diva-look-03",title:"تشكيلة سويت شيرت",category:"كاجوال",alt_text:"تشكيلة من السويت شيرت",image_url:"images/products/diva-look-03.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-04",title:"بلوفر مخطط",category:"بلوفرات",alt_text:"بلوفر شتوي مخطط",image_url:"images/products/diva-look-04.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-05",title:"توب تريكو كريمي",category:"تريكو",alt_text:"توب تريكو بلون كريمي",image_url:"images/products/diva-look-05.jpg",show_on_home:true,show_in_gallery:true},
   {image_key:"diva-look-06",title:"بلوفر كريمي مخطط",category:"بلوفرات",alt_text:"بلوفر كريمي بتفاصيل ملونة",image_url:"images/products/diva-look-06.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-07",title:"كارديجان نبيتي",category:"كارديجان",alt_text:"كارديجان نبيتي بأزرار أمامية",image_url:"images/products/diva-look-07.jpg",show_on_home:true,show_in_gallery:true},
   {image_key:"diva-look-08",title:"تشكيلة ملابس متنوعة",category:"تصوير المحل",alt_text:"لقطة عامة لتشكيلة الملابس",image_url:"images/products/diva-look-08.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-09",title:"تفاصيل الكارديجان النبيتي",category:"كارديجان",alt_text:"تفاصيل خامة الكارديجان النبيتي",image_url:"images/products/diva-look-09.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-10",title:"تفاصيل الهودي البيج",category:"هوديز",alt_text:"تفاصيل هودي بلون بيج",image_url:"images/products/diva-look-10.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-11",title:"جاكيت تريكو وردي",category:"تريكو",alt_text:"جاكيت تريكو وردي بسحاب",image_url:"images/products/diva-look-11.jpg",show_on_home:true,show_in_gallery:true},
   {image_key:"diva-look-12",title:"تشكيلة كارديجان",category:"تصوير المحل",alt_text:"تشكيلة كارديجان بألوان مختلفة",image_url:"images/products/diva-look-12.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-13",title:"تفاصيل الهودي الوردي",category:"هوديز",alt_text:"تفاصيل هودي وردي مطبوع",image_url:"images/products/diva-look-13.jpg",show_on_home:false,show_in_gallery:true},
   {image_key:"diva-look-14",title:"تشكيلة هوديز",category:"تصوير المحل",alt_text:"مجموعة هوديز بألوان مختلفة",image_url:"images/products/diva-look-14.jpg",show_on_home:false,show_in_gallery:true}
  ];
  const {data:existing,error:readError}=await db.from("diva_site_images").select("image_key");
  if(readError){if(status)status.textContent="تعذر مزامنة الصور: "+readError.message;return;}
  const keys=new Set((existing||[]).map(x=>x.image_key).filter(Boolean));
  const missing=bundled.filter(x=>!keys.has(x.image_key));
  if(!missing.length){if(status)status.textContent="الصور الـ14 موجودة بالفعل في إدارة الموقع.";return;}
  const {data:latest}=await db.from("diva_site_images").select("sort_order").order("sort_order",{ascending:false}).limit(1).maybeSingle();
  let order=Number(latest?.sort_order||0);
  const rows=missing.map(x=>({...x,active:true,storage_path:null,sort_order:++order}));
  const {error}=await db.from("diva_site_images").insert(rows);
  if(error){if(status)status.textContent="تعذر إضافة الصور تلقائيًا: "+error.message;return;}
  if(status)status.textContent="تمت إضافة الصور الجديدة تلقائيًا إلى الموقع ولوحة الإدارة.";
 }
 async function loadOffers(){const {data,error}=await db.from("diva_offers").select("*").order("sort_order");if(error)return toast(error.message);$("#offerCount").textContent=data.filter(x=>x.active).length;const box=$("#offersList");box.innerHTML=data.map(o=>`<article class="manage-item"><div><h3>${esc(o.title)} · ${esc(o.badge)}</h3><p>${esc(o.description)} · ${o.active?"منشور":"مخفي"}</p></div><div class="item-actions"><button data-edit-offer="${o.id}">تعديل</button><button class="danger" data-delete-offer="${o.id}">حذف</button></div></article>`).join("")||'<div class="empty">لا توجد عروض بعد.</div>';
  $$("[data-edit-offer]",box).forEach(b=>b.onclick=()=>{const o=data.find(x=>x.id===b.dataset.editOffer),f=$("#offerForm");Object.keys(o).forEach(k=>{if(f.elements[k]){if(f.elements[k].type==="checkbox")f.elements[k].checked=o[k];else f.elements[k].value=o[k]??"";}});window.scrollTo({top:f.offsetTop-100,behavior:"smooth"});});
  $$("[data-delete-offer]",box).forEach(b=>b.onclick=async()=>{if(!confirm("متأكد من حذف العرض؟"))return;const {error}=await db.from("diva_offers").delete().eq("id",b.dataset.deleteOffer);if(error)toast(error.message);else{toast("تم حذف العرض");loadOffers();}});
 }
 let siteImageCache=[];
 async function loadSiteImages(){
  const {data,error}=await db.from("diva_site_images").select("*").order("sort_order");
  if(error){const box=$("#siteImagesList");if(box)box.innerHTML='<div class="empty">لا يمكن قراءة صور الموقع. شغّل ملف site-images-migration.sql في Supabase أولاً.</div>';return;}
  siteImageCache=data||[];const count=$("#galleryCount");if(count)count.textContent=siteImageCache.filter(x=>x.active&&x.show_in_gallery).length;const box=$("#siteImagesList");if(!box)return;
  box.innerHTML=siteImageCache.map(g=>`<article class="manage-item"><img class="thumb" src="${esc(g.image_url)}" alt="${esc(g.alt_text||g.title)}"><div><h3>${esc(g.title)}</h3><p>${esc(g.category)} · ${g.show_on_home?"الرئيسية":""}${g.show_on_home&&g.show_in_gallery?" + ":""}${g.show_in_gallery?"المعرض":""} · ${g.active?"ظاهرة":"مخفية"}</p></div><div class="item-actions"><button data-edit-site-image="${g.id}">تعديل</button><button class="danger" data-delete-site-image="${g.id}">حذف</button></div></article>`).join("")||'<div class="empty">لا توجد صور. يمكنك إضافة أول صورة من النموذج أعلاه.</div>';
  $$('[data-edit-site-image]',box).forEach(b=>b.onclick=()=>{const g=siteImageCache.find(x=>x.id===b.dataset.editSiteImage),f=$("#siteImageForm");f.elements.id.value=g.id;f.elements.title.value=g.title;f.elements.category.value=g.category;f.elements.alt_text.value=g.alt_text||"";f.elements.active.checked=g.active;f.elements.placement.value=g.show_on_home?(g.show_in_gallery?"both":"home"):"gallery";f.scrollIntoView({behavior:"smooth",block:"center"});});
  $$('[data-delete-site-image]',box).forEach(b=>b.onclick=async()=>{const g=siteImageCache.find(x=>x.id===b.dataset.deleteSiteImage);if(!g||!confirm("حذف الصورة نهائيًا من إدارة الموقع؟"))return;if(g.storage_path){const removed=await db.storage.from("diva-media").remove([g.storage_path]);if(removed.error)return toast("لم يتم الحذف لأن حذف ملف الصورة من التخزين فشل: "+removed.error.message);}const {error}=await db.from("diva_site_images").delete().eq("id",g.id);if(error)return toast("تم حذف الملف من التخزين لكن تعذر حذف سجل الصورة: "+error.message);toast("تم حذف الصورة نهائيًا من الموقع والتخزين");loadSiteImages();});
 }
 async function loadSettings(){const {data,error}=await db.from("diva_settings").select("*");if(error)return;const f=$("#settingsForm");(data||[]).forEach(x=>{if(f.elements[x.key])f.elements[x.key].value=x.value;});}
 function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
})();
