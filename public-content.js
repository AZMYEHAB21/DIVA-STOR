(function(){
  const cfg=window.DIVA_SUPABASE||{};
  const ready=()=>window.supabase&&cfg.url&&!cfg.url.startsWith("YOUR_")&&cfg.anonKey&&!cfg.anonKey.startsWith("YOUR_");
  if(!ready()) return;
  const client=window.supabase.createClient(cfg.url,cfg.anonKey);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function load(){
    const offersGrid=document.getElementById("offersGrid");
    if(offersGrid){
      const {data,error}=await client.from("diva_offers").select("*").eq("active",true).order("sort_order");
      if(!error){
        offersGrid.innerHTML=(data||[]).map(o=>`<article class="o-card"><span class="o-badge">${esc(o.badge)}</span><div class="o-ico"><i class="fa-solid ${esc(o.icon||"fa-bag-shopping")}"></i></div><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><span class="o-date"><i class="fa-regular fa-calendar"></i>${esc(o.date_label)}</span></article>`).join("");
        const stage=document.getElementById("offersStage"), lock=document.getElementById("noOffersMessage");
        if(stage) stage.classList.toggle("is-locked",!data.length);
        if(lock) lock.hidden=!!data.length;
      }
    }
    // إدارة الصور الحالية والجديدة من جدول diva_site_images
    const {data:siteImages,error:imagesError}=await client.from("diva_site_images").select("*").eq("active",true).order("sort_order");
    if(!imagesError){
      const records=siteImages||[],byKey=new Map(records.filter(x=>x.image_key).map(x=>[x.image_key,x]));
      document.querySelectorAll("img[data-site-image]").forEach(img=>{
        const item=byKey.get(img.dataset.siteImage);
        if(!item){const holder=img.closest(".r-card,.hv,.g-item");if(holder)holder.hidden=true;else img.hidden=true;return;}
        img.src=item.image_url;img.alt=item.alt_text||item.title||"DIVA";
        const holder=img.closest(".r-card,.hv");if(holder&&holder.classList.contains("r-card")&&!item.show_on_home)holder.hidden=true;
        const card=img.closest(".r-card,.g-item");if(card){const title=card.querySelector(".cap b"),tag=card.querySelector(".tag");if(title)title.textContent=item.title;if(tag)tag.textContent=item.category;card.dataset.category=item.category;}
      });
      document.querySelectorAll("[data-site-image-bg]").forEach(el=>{const item=byKey.get(el.dataset.siteImageBg);if(item){if(item.show_on_home)el.dataset.img=item.image_url;else el.hidden=true;}else el.hidden=true;});
      const rail=document.querySelector("[data-rail]");
      if(rail){records.filter(x=>x.show_on_home&&!rail.querySelector(`img[data-site-image="${x.image_key||""}"]`)).forEach(item=>{const a=document.createElement("a");a.className="r-card";a.href="gallery.html";a.draggable=false;a.innerHTML=`<img src="${esc(item.image_url)}" alt="${esc(item.alt_text||item.title)}" loading="lazy"><div class="cap"><b>${esc(item.title)}</b><span class="tag">${esc(item.category)}</span></div>`;rail.append(a);});}
      const gallery=document.querySelector(".g-grid");
      if(gallery){
        const galleryItems=records.filter(x=>x.show_in_gallery);
        gallery.innerHTML=galleryItems.map(g=>`<button class="g-item" type="button" data-category="${esc(g.category)}" aria-label="عرض صورة: ${esc(g.title)}"><img src="${esc(g.image_url)}" alt="${esc(g.alt_text||g.title)}" loading="lazy"><span class="zoom"><i class="fa-solid fa-expand"></i></span><span class="cap"><b>${esc(g.title)}</b><span class="tag">${esc(g.category)}</span></span></button>`).join("");
        const pills=document.querySelector(".pills");
        if(pills){const categories=[...new Set(galleryItems.map(x=>x.category).filter(Boolean))];pills.innerHTML='<span class="slider" aria-hidden="true"></span><button class="pill active" data-filter="all" aria-pressed="true">الكل</button>'+categories.map(c=>`<button class="pill" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("");}
        const count=document.getElementById("gCount");if(count)count.textContent=galleryItems.length;
        initGallery(gallery);
      }
    }
    // إعدادات نصية اختيارية: hero_title, hero_subtitle, hero_image
    const {data:settings}=await client.from("diva_settings").select("*");
    (settings||[]).forEach(x=>{
      if(x.key==="hero_title"){const el=document.querySelector("[data-cms-hero-title]");if(el)el.textContent=x.value;}
      if(x.key==="hero_subtitle"){const el=document.querySelector("[data-cms-hero-subtitle]");if(el)el.textContent=x.value;}
      if(x.key==="hero_image"){const el=document.querySelector("[data-cms-hero-image]");if(el)el.src=x.value;}
    });
  }
  function initGallery(grid){
    const filters=[...document.querySelectorAll("[data-filter]")], count=document.getElementById("gCount");
    let active="all";
    function filter(){
      const visible=[...grid.querySelectorAll(".g-item")].filter(x=>active==="all"||x.dataset.category===active);
      grid.querySelectorAll(".g-item").forEach(x=>x.hidden=!visible.includes(x));
      if(count)count.textContent=visible.length;
    }
    filters.forEach(b=>b.addEventListener("click",()=>{active=b.dataset.filter;filters.forEach(x=>{x.classList.toggle("active",x===b);x.setAttribute("aria-pressed",String(x===b));});filter();}));
    grid.addEventListener("click",e=>{
      const card=e.target.closest(".g-item");if(!card)return;
      const img=card.querySelector("img");const lb=document.getElementById("lb");
      if(lb){const target=document.getElementById("lbImg"),cap=document.getElementById("lbCap");if(target)target.src=img.src;if(cap)cap.textContent=img.alt;lb.classList.add("open");lb.setAttribute("aria-hidden","false");document.body.classList.add("no-scroll");}
      else window.open(img.src,"_blank","noopener");
    });
    filter();
  }
  document.addEventListener("DOMContentLoaded",load);
})();