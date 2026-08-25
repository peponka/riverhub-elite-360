UPDATE public.subscriptions
SET price_usd = 115
WHERE plan_id = 'individual'
  AND contract_status IN ('trial', 'active', 'pending_sales');

SELECT company_id, plan_id, price_usd, contract_status
FROM public.subscriptions
WHERE plan_id = 'individual';
