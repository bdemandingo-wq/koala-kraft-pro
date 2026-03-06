-- Global backfill: compute and set cleaner_pay_expected for ALL bookings across ALL organizations
-- where cleaner_wage is set but cleaner_pay_expected is NULL
-- This ensures payroll is correct for every cleaner in every organization

-- 1. Flat rate bookings
UPDATE bookings
SET cleaner_pay_expected = cleaner_wage
WHERE cleaner_pay_expected IS NULL
  AND cleaner_wage IS NOT NULL
  AND cleaner_wage_type = 'flat';

-- 2. Hourly bookings (use override hours if set, otherwise duration/60)
UPDATE bookings
SET cleaner_pay_expected = ROUND(
  cleaner_wage * COALESCE(cleaner_override_hours, duration / 60.0)::numeric, 2
)
WHERE cleaner_pay_expected IS NULL
  AND cleaner_wage IS NOT NULL
  AND cleaner_wage_type = 'hourly';

-- 3. Percentage bookings
UPDATE bookings
SET cleaner_pay_expected = ROUND(
  (cleaner_wage / 100.0) * COALESCE(subtotal, total_amount)::numeric, 2
)
WHERE cleaner_pay_expected IS NULL
  AND cleaner_wage IS NOT NULL
  AND cleaner_wage_type = 'percentage';

-- 4. Also backfill from cleaner_actual_payment where cleaner_pay_expected is still null
UPDATE bookings
SET cleaner_pay_expected = cleaner_actual_payment
WHERE cleaner_pay_expected IS NULL
  AND cleaner_actual_payment IS NOT NULL;

-- 5. Sync booking_team_assignments.pay_share with cleaner_pay_expected for single-cleaner bookings
UPDATE booking_team_assignments bta
SET pay_share = b.cleaner_pay_expected
FROM bookings b
WHERE bta.booking_id = b.id
  AND b.cleaner_pay_expected IS NOT NULL
  AND (bta.pay_share IS NULL OR bta.pay_share != b.cleaner_pay_expected)
  AND bta.is_primary = true
  AND NOT EXISTS (
    SELECT 1 FROM booking_team_assignments bta2
    WHERE bta2.booking_id = bta.booking_id
      AND bta2.staff_id != bta.staff_id
  );