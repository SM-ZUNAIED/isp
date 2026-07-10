
UPDATE public.settings
SET landing_content = COALESCE(landing_content, '{}'::jsonb) || jsonb_build_object(
  'features', COALESCE(landing_content->'features', '[]'::jsonb) ||
    CASE WHEN landing_content ? 'features' AND jsonb_array_length(landing_content->'features') > 0 THEN '[]'::jsonb ELSE
    '[
      {"icon":"zap","title_bn":"সুপার ফাস্ট স্পিড","title_en":"Super Fast Speed","desc_bn":"আধুনিক ফাইবার অপটিক নেটওয়ার্কে গিগাবিট গতির ইন্টারনেট।","desc_en":"Gigabit internet over modern fiber optic network."},
      {"icon":"shield","title_bn":"নিরাপদ কানেকশন","title_en":"Secure Connection","desc_bn":"এন্টারপ্রাইজ-গ্রেড সিকিউরিটি এবং DDoS প্রোটেকশন।","desc_en":"Enterprise-grade security with DDoS protection."},
      {"icon":"signal","title_bn":"স্থিতিশীল সংযোগ","title_en":"Stable Connection","desc_bn":"রিডানডেন্ট আপলিংক ও ২৪/৭ মনিটরিং।","desc_en":"Redundant uplinks and 24/7 monitoring."},
      {"icon":"router","title_bn":"মিকরোটিক অটোমেশন","title_en":"MikroTik Automation","desc_bn":"সম্পূর্ণ অটোমেটিক PPPoE, Radius ও ব্যান্ডউইথ ব্যবস্থাপনা।","desc_en":"Fully automated PPPoE, Radius and bandwidth management."},
      {"icon":"headphones","title_bn":"২৪/৭ কাস্টমার কেয়ার","title_en":"24/7 Customer Care","desc_bn":"যেকোনো সমস্যায় তাৎক্ষণিক সাপোর্ট।","desc_en":"Instant support for any issue."},
      {"icon":"award","title_bn":"সেরা মূল্য","title_en":"Best Price","desc_bn":"বাজারের সেরা প্যাকেজ এবং অসীম ডেটা।","desc_en":"Best market packages with unlimited data."}
    ]'::jsonb END,
  'about_stats', COALESCE(landing_content->'about_stats', '[]'::jsonb) ||
    CASE WHEN landing_content ? 'about_stats' AND jsonb_array_length(landing_content->'about_stats') > 0 THEN '[]'::jsonb ELSE
    '[
      {"value":"১০+","label_bn":"বছরের অভিজ্ঞতা","label_en":"Years of experience"},
      {"value":"১০০+","label_bn":"টেকনিক্যাল টিম","label_en":"Technical team"}
    ]'::jsonb END,
  'reviews', COALESCE(landing_content->'reviews', '[]'::jsonb) ||
    CASE WHEN landing_content ? 'reviews' AND jsonb_array_length(landing_content->'reviews') > 0 THEN '[]'::jsonb ELSE
    '[
      {"name":"মোঃ রফিকুল ইসলাম","loc_bn":"ঢাকা","loc_en":"Dhaka","text_bn":"দুর্দান্ত সেবা! কোনো ডাউনটাইম নেই। ২৪ ঘণ্টা সাপোর্ট সবসময় পাওয়া যায়।","text_en":"Excellent service! No downtime. 24-hour support always available."},
      {"name":"সাবরিনা আক্তার","loc_bn":"চট্টগ্রাম","loc_en":"Chittagong","text_bn":"স্পিড অসাধারণ। বাসায় সবাই একসাথে ব্যবহার করেও কোনো সমস্যা হয় না।","text_en":"Amazing speed. No issues even when everyone at home uses it together."},
      {"name":"মোঃ কামাল হোসেন","loc_bn":"সিলেট","loc_en":"Sylhet","text_bn":"বিলিং সিস্টেম খুব সহজ। বিকাশ থেকে সরাসরি পেমেন্ট করা যায়।","text_en":"Billing system is very easy. Direct payment from bKash."}
    ]'::jsonb END,
  'faqs', COALESCE(landing_content->'faqs', '[]'::jsonb) ||
    CASE WHEN landing_content ? 'faqs' AND jsonb_array_length(landing_content->'faqs') > 0 THEN '[]'::jsonb ELSE
    '[
      {"q_bn":"কানেকশন নিতে কত সময় লাগে?","q_en":"How long does it take to get a connection?","a_bn":"সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে ইনস্টলেশন সম্পন্ন হয়।","a_en":"Installation is usually completed within 24-48 hours."},
      {"q_bn":"কীভাবে বিল পরিশোধ করব?","q_en":"How do I pay the bill?","a_bn":"বিকাশ, নগদ, রকেট বা ব্যাংক ট্রান্সফারের মাধ্যমে সহজেই বিল দিতে পারবেন।","a_en":"Easily pay via bKash, Nagad, Rocket, or bank transfer."},
      {"q_bn":"সাপোর্ট কীভাবে পাব?","q_en":"How do I get support?","a_bn":"হটলাইন, WhatsApp, অথবা কাস্টমার পোর্টালে টিকিট সাবমিট করে সাপোর্ট নিতে পারবেন।","a_en":"Contact via hotline, WhatsApp, or submit a ticket in the customer portal."},
      {"q_bn":"প্যাকেজ পরিবর্তন করতে পারব?","q_en":"Can I change my package?","a_bn":"হ্যাঁ, যেকোনো সময় প্যাকেজ আপগ্রেড বা ডাউনগ্রেড করা যাবে।","a_en":"Yes, you can upgrade or downgrade your package anytime."}
    ]'::jsonb END
)
WHERE id = 1;
