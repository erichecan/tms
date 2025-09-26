--
-- PostgreSQL database dump
--

\restrict 2HQlAcRMfFDAdrjt7tvscFDHHGl67i0DwArp2P6fwP8vko78U0Tyye487WJCl3d

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.tenants (id, name, domain, schema_name, status, settings, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	TMS Demo Company	demo.tms-platform.com	tenant_demo	active	{}	2025-09-23 22:53:26.107312	2025-09-23 22:53:26.107312
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.customers (id, tenant_id, name, level, contact_info, billing_info, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000001	示例客户公司	vip	{"email": "customer@example.com", "phone": "13800138000", "address": {"city": "北京", "state": "北京", "street": "示例街道123号", "country": "中国", "postalCode": "100000"}, "contactPerson": "张经理"}	{"taxId": "91110000000000000X", "companyName": "示例客户公司", "paymentTerms": "月结30天", "billingAddress": {"city": "北京", "state": "北京", "street": "示例街道123号", "country": "中国", "postalCode": "100000"}}	2025-09-23 22:53:26.17861	2025-09-23 22:53:26.17861
a349d7d9-2d7e-4410-9586-88dc1aa5fd4f	00000000-0000-0000-0000-000000000001	wenbin	standard	{"email": "eric@qq.com", "phone": "14372999568", "address": {"city": "Default City", "state": "Default State", "street": "Default Street", "country": "Default Country", "postalCode": "000000"}}	\N	2025-09-26 19:54:59.798966	2025-09-26 19:54:59.798966
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.vehicles (id, plate_number, type, capacity_kg, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.drivers (id, tenant_id, name, phone, license_number, vehicle_info, status, performance, created_at, updated_at, vehicle_id) FROM stdin;
00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000001	李司机	13900139000	A123456789	{"type": "truck", "capacity": 10000, "features": ["尾板", "GPS"], "dimensions": {"width": 2.5, "height": 2.8, "length": 6}, "licensePlate": "京A12345"}	active	{"rating": 4.8, "onTimeRate": 0.95, "totalDeliveries": 150, "customerSatisfaction": 0.92}	2025-09-23 22:53:26.179294	2025-09-23 22:53:26.179294	\N
\.


--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.shipments (id, tenant_id, shipment_number, customer_id, driver_id, pickup_address, delivery_address, cargo_info, estimated_cost, actual_cost, additional_fees, applied_rules, status, timeline, notes, created_at, updated_at, shipper_name, shipper_phone, shipper_addr_line1, shipper_city, shipper_province, shipper_postal_code, shipper_country, receiver_name, receiver_phone, receiver_addr_line1, receiver_city, receiver_province, receiver_postal_code, receiver_country, weight_kg, dimensions, final_cost) FROM stdin;
a41ab2c5-334d-4ce4-8386-4e5ff0ba86f3	00000000-0000-0000-0000-000000000001	SH20250923185841981	\N	\N	{"city": "北京", "name": "张三", "phone": "13800138000", "country": "中国", "province": "北京", "postalCode": "", "addressLine1": "北京市朝阳区测试街道123号"}	{"city": "上海", "name": "李四", "phone": "13900139000", "country": "中国", "province": "上海", "postalCode": "", "addressLine1": "上海市浦东新区测试路456号"}	{"items": [], "weightKg": 5.5}	\N	\N	[]	[]	created	{"created": "2025-09-23T22:58:41.981Z"}	\N	2025-09-23 22:58:42.007242	2025-09-23 22:58:42.007242	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3db3c1a2-d131-46b8-ba54-4ac94f32d7a6	00000000-0000-0000-0000-000000000001	TMS202509260001	a349d7d9-2d7e-4410-9586-88dc1aa5fd4f	\N	{"city": "Markham", "state": "Ontario", "street": "1399 Kennedy", "country": "CA", "postalCode": "L3r 5w7"}	{"city": "Markham", "state": "Ontario", "street": "8345 Kennedy", "country": "CA", "postalCode": "l6w 7r7"}	{"value": 0, "volume": 1000, "weight": 10, "hazardous": false, "dimensions": {"width": 10, "height": 10, "length": 10}, "description": "", "specialRequirements": []}	115.00	\N	[]	[]	pending	{"created": "2025-09-26T19:54:59.818Z"}	\N	2025-09-26 19:54:59.818454	2025-09-26 19:54:59.818454	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.assignments (id, shipment_id, driver_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: financial_records; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.financial_records (id, tenant_id, type, reference_id, amount, currency, status, due_date, paid_at, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.notifications (id, type, target_role, shipment_id, driver_id, created_at, payload, delivered) FROM stdin;
\.


--
-- Data for Name: proof_of_delivery; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.proof_of_delivery (id, shipment_id, file_path, uploaded_at, uploaded_by, note) FROM stdin;
\.


--
-- Data for Name: rules; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.rules (id, tenant_id, name, description, type, priority, conditions, actions, status, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000001	VIP客户长途折扣	VIP客户运输距离超过500公里时享受15%折扣	pricing	100	[{"fact": "customerLevel", "value": "vip", "operator": "equal"}, {"fact": "transportDistance", "value": 500, "operator": "greaterThan"}]	[{"type": "applyDiscount", "params": {"percentage": 15}}]	active	2025-09-23 22:53:26.179936	2025-09-23 22:53:26.179936
00000000-0000-0000-0000-000000000002	00000000-0000-0000-0000-000000000001	司机基础提成	所有司机基础提成30%	payroll	300	[{"fact": "driverId", "value": "", "operator": "isNotEmpty"}]	[{"type": "setDriverCommission", "params": {"percentage": 30}}]	active	2025-09-23 22:53:26.180562	2025-09-23 22:53:26.180562
\.


--
-- Data for Name: rule_executions; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.rule_executions (id, tenant_id, rule_id, context, result, execution_time, created_at) FROM stdin;
\.


--
-- Data for Name: statements; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.statements (id, tenant_id, type, reference_id, period_start, period_end, items, total_amount, status, generated_at, generated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: timeline_events; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.timeline_events (id, shipment_id, event_type, from_status, to_status, actor_type, actor_id, "timestamp", extra) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: tms_user
--

COPY public.users (id, tenant_id, email, password_hash, role, profile, status, last_login_at, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000001	admin@demo.tms-platform.com	$2a$10$GplA4J5iV/b/9gA.Ie3m.OqISjLdC0caN203n4i/TEc2T5.ZDCz/6	admin	{}	active	\N	2025-09-23 22:53:26.108022	2025-09-23 22:53:26.108022
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 2HQlAcRMfFDAdrjt7tvscFDHHGl67i0DwArp2P6fwP8vko78U0Tyye487WJCl3d

