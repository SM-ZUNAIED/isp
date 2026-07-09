DELETE FROM public.packages
WHERE name IN ('বেসিক','স্ট্যান্ডার্ড','প্রিমিয়াম','আল্ট্রা')
  AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.package_id = packages.id);