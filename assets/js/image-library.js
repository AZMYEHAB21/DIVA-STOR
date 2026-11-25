/*
 * DIVA image catalogue
 * This is the local fallback and the single source used to seed the admin CMS.
 * Keep image_url values stable: existing Supabase rows refer to these paths.
 */
window.DIVA_IMAGE_LIBRARY = Object.freeze([
  { image_key: "diva-look-01", title: "هودي مطبوع", category: "هوديز", alt_text: "هودي مطبوع بألوان هادئة من تشكيلة DIVA", image_url: "images/products/diva-look-01.jpg", show_on_home: true, show_in_gallery: true, sort_order: 1 },
  { image_key: "diva-look-02", title: "هودي وردي بطباعة", category: "هوديز", alt_text: "هودي وردي بتصميم مطبوع", image_url: "images/products/diva-look-02.jpg", show_on_home: true, show_in_gallery: true, sort_order: 2 },
  { image_key: "diva-look-03", title: "تشكيلة سويت شيرت", category: "كاجوال", alt_text: "تشكيلة من السويت شيرت", image_url: "images/products/diva-look-03.jpg", show_on_home: false, show_in_gallery: true, sort_order: 3 },
  { image_key: "diva-look-04", title: "بلوفر مخطط", category: "بلوفرات", alt_text: "بلوفر شتوي مخطط", image_url: "images/products/diva-look-04.jpg", show_on_home: false, show_in_gallery: true, sort_order: 4 },
  { image_key: "diva-look-05", title: "توب تريكو كريمي", category: "تريكو", alt_text: "توب تريكو بلون كريمي", image_url: "images/products/diva-look-05.jpg", show_on_home: true, show_in_gallery: true, sort_order: 5 },
  { image_key: "diva-look-06", title: "بلوفر كريمي مخطط", category: "بلوفرات", alt_text: "بلوفر كريمي بتفاصيل ملونة", image_url: "images/products/diva-look-06.jpg", show_on_home: false, show_in_gallery: true, sort_order: 6 },
  { image_key: "diva-look-07", title: "كارديجان نبيتي", category: "كارديجان", alt_text: "كارديجان نبيتي بأزرار أمامية", image_url: "images/products/diva-look-07.jpg", show_on_home: true, show_in_gallery: true, sort_order: 7 },
  { image_key: "diva-look-08", title: "تشكيلة ملابس متنوعة", category: "تصوير المحل", alt_text: "لقطة عامة لتشكيلة الملابس داخل محل DIVA", image_url: "images/products/diva-look-08.jpg", show_on_home: false, show_in_gallery: true, sort_order: 8 },
  { image_key: "diva-look-09", title: "تفاصيل الكارديجان النبيتي", category: "كارديجان", alt_text: "تفاصيل خامة الكارديجان النبيتي", image_url: "images/products/diva-look-09.jpg", show_on_home: false, show_in_gallery: true, sort_order: 9 },
  { image_key: "diva-look-10", title: "تفاصيل الهودي البيج", category: "هوديز", alt_text: "تفاصيل هودي بلون بيج", image_url: "images/products/diva-look-10.jpg", show_on_home: false, show_in_gallery: true, sort_order: 10 },
  { image_key: "diva-look-11", title: "جاكيت تريكو وردي", category: "تريكو", alt_text: "جاكيت تريكو وردي بسحاب", image_url: "images/products/diva-look-11.jpg", show_on_home: true, show_in_gallery: true, sort_order: 11 },
  { image_key: "diva-look-12", title: "تشكيلة كارديجان", category: "تصوير المحل", alt_text: "تشكيلة كارديجان بألوان مختلفة", image_url: "images/products/diva-look-12.jpg", show_on_home: false, show_in_gallery: true, sort_order: 12 },
  { image_key: "diva-look-13", title: "تفاصيل الهودي الوردي", category: "هوديز", alt_text: "تفاصيل هودي وردي مطبوع", image_url: "images/products/diva-look-13.jpg", show_on_home: false, show_in_gallery: true, sort_order: 13 },
  { image_key: "diva-look-14", title: "تشكيلة هوديز", category: "تصوير المحل", alt_text: "مجموعة هوديز بألوان مختلفة", image_url: "images/products/diva-look-14.jpg", show_on_home: false, show_in_gallery: true, sort_order: 14 }
].map(Object.freeze));
