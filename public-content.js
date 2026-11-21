(function(){
  const cfg=window.DIVA_SUPABASE||{};
  const ready=()=>window.supabase&&cfg.url&&!cfg.url.startsWith("YOUR_")&&cfg.anonKey&&!cfg.anonKey.startsWith("YOUR_");
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const notice=(container,message)=>{if(!container)return;let n=container.querySelector("[data-cms-notice]");if(!n){n=document.createElement("p");n.dataset.cmsNotice="1";n.className="cms-notice";container.append(n);}n.textContent=message;};
  if(!ready()){
    document.addEventListener("DOMContentLoaded",()=>{
      const g=document.getElementById("offersGrid");if(g)g.replaceChildren();
      document.querySelectorAll("img[data-site-image]").forEach(img=>{const holder=img.closest(".r-card,.hv,.g-item");if(holder)holder.hidden=true;else img.hidden=true;});
      document.querySelectorAll("[data-site-image-bg]").forEach(el=>el.hidden=true);
      const gallery=document.querySelector(".g-grid");if(gallery)gallery.replaceChildren();
      const rail=document.querySelector("[data-rail]");if(rail)rail.replaceChildren();
    });
    return;
  }
  const client=window.supabase.createClient(cfg.url,cfg.anonKey);
  async function load(){
    const offersGrid=document.getElementById("offersGrid");
    if(offersGrid){
      const {data,error}=await client.from("diva_offers").select("*").eq("active",true).order("sort_order");
      const stage=document.getElementById("offersStage"),lock=document.getElementById("noOffersMessage");
      if(error){
        offersGrid.replaceChildren();
        if(stage)stage.classList.add("is-locked");
        if(lock){lock.hidden=false;const h=lock.querySelector("h2"),p=lock.querySelector("p");if(h)h.textContent="تعذر تحميل العروض";if(p)p.textContent="حدثت مشكلة في الاتصال. حاولي تحديث الصفحة لاحقاً.";}
      }else{
        offersGrid.innerHTML=(data||[]).map(o=>`<article class="o-card"><span class="o-badge">${esc(o.badge)}</span><div class="o-ico"><i class="fa-solid ${esc(o.icon||"fa-bag-shopping")}"></i></div><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><span class="o-date"><i class="fa-regular fa-calendar"></i>${esc(o.date_label)}</span></article>`).join("");
        if(stage)stage.classList.toggle("is-locked",!(data||[]).length);
        if(lock){lock.hidden=!!(data||[]).length;const h=lock.querySelector("h2"),p=lock.querySelector("p");if(h)h.textContent="لا توجد عروض متاحة الآن";if(p)p.textContent="نعتذر عن عدم توفر عروض حالياً.";}
      }
    }

    const {data:siteImages,error:imagesError}=await client.from("diva_site_images").select("*").eq("active",true).order("sort_order");
    if(imagesError){
      document.querySelectorAll("img[data-site-image]").forEach(img=>{const holder=img.closest(".r-card,.hv,.g-item");if(holder)holder.hidden=true;else img.hidden=true;});
      document.querySelectorAll("[data-site-image-bg]").forEach(el=>el.hidden=true);
      const gallery=document.querySelector(".g-grid");if(gallery){gallery.replaceChildren();notice(gallery,"تعذر تحميل صور الموقع. يرجى المحاولة لاحقاً.");}
      const rail=document.querySelector("[data-rail]");if(rail)rail.replaceChildren();
      return;
    }
    const records=siteImages||[],byKey=new Map(records.filter(x=>x.image_key).map(x=>[x.image_key,x]));
    document.querySelectorAll("img[data-site-image]").forEach(img=>{
      const item=byKey.get(img.dataset.siteImage);
      if(!item){const holder=img.closest(".r-card,.hv,.g-item");if(holder)holder.hidden=true;else img.hidden=true;return;}
      img.hidden=false;img.src=item.image_url;img.alt=item.alt_text||item.title||"DIVA";
      const holder=img.closest(".r-card,.hv");if(holder&&holder.classList.contains("r-card"))holder.hidden=!item.show_on_home;
      const card=img.closest(".r-card,.g-item");if(card){const title=card.querySelector(".cap b"),tag=card.querySelector(".tag");if(title)title.textContent=item.title;if(tag)tag.textContent=item.category;card.dataset.category=item.category;}
    });
    document.querySelectorAll("[data-site-image-bg]").forEach(el=>{const item=byKey.get(el.dataset.siteImageBg);if(item&&item.show_on_home){el.hidden=false;el.dataset.img=item.image_url;}else el.hidden=true;});
    const rail=document.querySelector("[data-rail]");
    if(rail){
      records.filter(x=>x.show_on_home&&!rail.querySelector(`img[data-site-image="${x.image_key||""}"]`)).forEach(item=>{
        const a=document.createElement("a");a.className="r-card";a.href="gallery.html";a.draggable=false;
        a.innerHTML=`<img src="${esc(item.image_url)}" alt="${esc(item.alt_text||item.title)}" loading="lazy"><div class="cap"><b>${esc(item.title)}</b><span class="tag">${esc(item.category)}</span></div>`;rail.append(a);
      });
    }
    const gallery=document.querySelector(".g-grid");
    if(gallery){
      const galleryItems=records.filter(x=>x.show_in_gallery);
      gallery.innerHTML=galleryItems.map(g=>`<button class="g-item" type="button" data-category="${esc(g.category)}" aria-label="عرض صورة: ${esc(g.title)}"><img src="${esc(g.image_url)}" alt="${esc(g.alt_text||g.title)}" loading="lazy"><span class="zoom"><i class="fa-solid fa-expand"></i></span><span class="cap"><b>${esc(g.title)}</b><span class="tag">${esc(g.category)}</span></span></button>`).join("");
      const pills=document.querySelector(".pills");
      if(pills){const categories=[...new Set(galleryItems.map(x=>x.category).filter(Boolean))];pills.innerHTML='<span class="slider" aria-hidden="true"></span><button class="pill active" data-filter="all" aria-pressed="true">الكل</button>'+categories.map(c=>`<button class="pill" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("");}
      const count=document.getElementById("gCount");if(count)count.textContent=galleryItems.length;
      initGallery(gallery);
    }
    const {data:settings,error:settingsError}=await client.from("diva_settings").select("*");
    if(!settingsError)(settings||[]).forEach(x=>{
      if(x.key==="hero_title"){const el=document.querySelector("[data-cms-hero-title]");if(el)el.textContent=x.value;}
      if(x.key==="hero_subtitle"){const el=document.querySelector("[data-cms-hero-subtitle]");if(el)el.textContent=x.value;}
      if(x.key==="hero_image"){const el=document.querySelector("[data-cms-hero-image]");if(el)el.src=x.value;}
    });
  }
  function initGallery(grid){
    const filters=[...document.querySelectorAll("[data-filter]")],count=document.getElementById("gCount");
    let active="all";
    function filter(){
      const visible=[...grid.querySelectorAll(".g-item")].filter(x=>active==="all"||x.dataset.category===active);
      grid.querySelectorAll(".g-item").forEach(x=>x.hidden=!visible.includes(x));
      if(count)count.textContent=visible.length;
    }
    filters.forEach(b=>b.addEventListener("click",()=>{active=b.dataset.filter;filters.forEach(x=>{x.classList.toggle("active",x===b);x.setAttribute("aria-pressed",String(x===b));});filter();}));
    grid.addEventListener("click",e=>{
      const card=e.target.closest(".g-item");if(!card)return;
      const img=card.querySelector("img"),lb=document.getElementById("lb");
      if(lb){const target=document.getElementById("lbImg"),cap=document.getElementById("lbCap");if(target)target.src=img.src;if(cap)cap.textContent=img.alt;lb.classList.add("open");lb.setAttribute("aria-hidden","false");document.body.classList.add("no-scroll");}
      else window.open(img.src,"_blank","noopener");
    });
    filter();
  }
  document.addEventListener("DOMContentLoaded",load);
})();