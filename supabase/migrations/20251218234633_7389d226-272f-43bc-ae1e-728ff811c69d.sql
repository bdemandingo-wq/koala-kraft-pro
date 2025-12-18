-- Fix RLS policies to be PERMISSIVE (so admin/staff access works) and remove unsafe public access.

-- BOOKINGS
alter table public.bookings enable row level security;

drop policy if exists "Admin can manage bookings" on public.bookings;
drop policy if exists "Anyone can create bookings" on public.bookings;
drop policy if exists "Anyone can view own booking" on public.bookings;
drop policy if exists "Staff can view assigned bookings" on public.bookings;

drop policy if exists "Admins can manage bookings" on public.bookings;
drop policy if exists "Admins and staff can create bookings" on public.bookings;
drop policy if exists "Staff can update assigned bookings" on public.bookings;

create policy "Admins can manage bookings"
on public.bookings
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins and staff can create bookings"
on public.bookings
as permissive
for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'staff'::public.app_role)
);

create policy "Staff can view assigned bookings"
on public.bookings
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.staff s
    where s.id = bookings.staff_id
      and s.user_id = auth.uid()
  )
);

create policy "Staff can update assigned bookings"
on public.bookings
as permissive
for update
to authenticated
using (
  exists (
    select 1
    from public.staff s
    where s.id = bookings.staff_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.staff s
    where s.id = bookings.staff_id
      and s.user_id = auth.uid()
  )
);


-- CUSTOMERS (PII)
alter table public.customers enable row level security;

drop policy if exists "Admin can manage customers" on public.customers;
drop policy if exists "Anyone can create customer" on public.customers;
drop policy if exists "Customers can view own record" on public.customers;
drop policy if exists "Staff can view customers" on public.customers;

drop policy if exists "Admins can manage customers" on public.customers;
drop policy if exists "Staff can create customers" on public.customers;
drop policy if exists "Users can view own customer record" on public.customers;

create policy "Admins can manage customers"
on public.customers
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Staff can view customers"
on public.customers
as permissive
for select
to authenticated
using (public.has_role(auth.uid(), 'staff'::public.app_role));

create policy "Staff can create customers"
on public.customers
as permissive
for insert
to authenticated
with check (public.has_role(auth.uid(), 'staff'::public.app_role));

create policy "Users can view own customer record"
on public.customers
as permissive
for select
to authenticated
using (user_id = auth.uid());


-- SERVICES
alter table public.services enable row level security;

drop policy if exists "Admins can manage services" on public.services;
drop policy if exists "Admins can view all services" on public.services;
drop policy if exists "Anyone can view active services" on public.services;

create policy "Admins can manage services"
on public.services
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Anyone can view active services"
on public.services
as permissive
for select
to anon, authenticated
using (is_active = true);


-- STAFF
alter table public.staff enable row level security;

drop policy if exists "Admins can manage staff" on public.staff;
drop policy if exists "Admins can view all staff" on public.staff;
drop policy if exists "Anyone can view active staff" on public.staff;
drop policy if exists "Staff can update own record" on public.staff;
drop policy if exists "Staff can view own record" on public.staff;

create policy "Admins can manage staff"
on public.staff
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Anyone can view active staff"
on public.staff
as permissive
for select
to anon, authenticated
using (is_active = true);

create policy "Staff can view own record"
on public.staff
as permissive
for select
to authenticated
using (user_id = auth.uid());

create policy "Staff can update own record"
on public.staff
as permissive
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


-- STAFF_SERVICES
alter table public.staff_services enable row level security;

drop policy if exists "Admins can manage staff services" on public.staff_services;
drop policy if exists "Anyone can view staff services" on public.staff_services;

create policy "Admins can manage staff services"
on public.staff_services
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Anyone can view staff services"
on public.staff_services
as permissive
for select
to anon, authenticated
using (true);


-- SERVICE_CATEGORIES
alter table public.service_categories enable row level security;

drop policy if exists "Admins can manage categories" on public.service_categories;
drop policy if exists "Anyone can view categories" on public.service_categories;

create policy "Admins can manage categories"
on public.service_categories
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Anyone can view categories"
on public.service_categories
as permissive
for select
to anon, authenticated
using (true);


-- WORKING_HOURS
alter table public.working_hours enable row level security;

drop policy if exists "Admins can manage working hours" on public.working_hours;
drop policy if exists "Anyone can view working hours" on public.working_hours;

create policy "Admins can manage working hours"
on public.working_hours
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Anyone can view working hours"
on public.working_hours
as permissive
for select
to anon, authenticated
using (true);


-- BUSINESS_SETTINGS
alter table public.business_settings enable row level security;

drop policy if exists "Admins can manage settings" on public.business_settings;
drop policy if exists "Anyone can view settings" on public.business_settings;

create policy "Admins can manage settings"
on public.business_settings
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Anyone can view settings"
on public.business_settings
as permissive
for select
to anon, authenticated
using (true);


-- PROFILES
alter table public.profiles enable row level security;

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Admins can view all profiles"
on public.profiles
as permissive
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Users can view own profile"
on public.profiles
as permissive
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
as permissive
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- USER_ROLES
alter table public.user_roles enable row level security;

drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Users can view own roles" on public.user_roles;

create policy "Admins can manage roles"
on public.user_roles
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Users can view own roles"
on public.user_roles
as permissive
for select
to authenticated
using (auth.uid() = user_id);
