--
-- PostgreSQL database dump
--

\restrict 0SeMh0oQqMvqYvRotjQAiJgVnCmcPKlL66XOR5qg5sI3ArqkbxPYehjCRUWjOA4

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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid,
    driver_id uuid,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assignments OWNER TO tms_user;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    name character varying(255) NOT NULL,
    level character varying(50) DEFAULT 'standard'::character varying,
    contact_info jsonb DEFAULT '{}'::jsonb,
    billing_info jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO tms_user;

--
-- Name: drivers; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.drivers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    name character varying(255) NOT NULL,
    phone character varying(20),
    license_number character varying(50),
    vehicle_info jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'available'::character varying,
    performance jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vehicle_id uuid
);


ALTER TABLE public.drivers OWNER TO tms_user;

--
-- Name: financial_records; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.financial_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    type character varying(50) NOT NULL,
    reference_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'CAD'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    due_date date,
    paid_at timestamp without time zone,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.financial_records OWNER TO tms_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying(50) NOT NULL,
    target_role character varying(50) NOT NULL,
    shipment_id uuid,
    driver_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payload jsonb DEFAULT '{}'::jsonb,
    delivered boolean DEFAULT false
);


ALTER TABLE public.notifications OWNER TO tms_user;

--
-- Name: proof_of_delivery; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.proof_of_delivery (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid,
    file_path text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    uploaded_by character varying(20) NOT NULL,
    note text
);


ALTER TABLE public.proof_of_delivery OWNER TO tms_user;

--
-- Name: rule_executions; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.rule_executions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    rule_id uuid,
    context jsonb NOT NULL,
    result jsonb NOT NULL,
    execution_time integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rule_executions OWNER TO tms_user;

--
-- Name: rules; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    priority integer NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rules OWNER TO tms_user;

--
-- Name: shipments; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.shipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    shipment_number character varying(50) NOT NULL,
    customer_id uuid,
    driver_id uuid,
    pickup_address jsonb NOT NULL,
    delivery_address jsonb NOT NULL,
    cargo_info jsonb NOT NULL,
    estimated_cost numeric(10,2),
    actual_cost numeric(10,2),
    additional_fees jsonb DEFAULT '[]'::jsonb,
    applied_rules jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'created'::character varying,
    timeline jsonb DEFAULT '{}'::jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shipper_name character varying(255),
    shipper_phone character varying(50),
    shipper_addr_line1 character varying(255),
    shipper_city character varying(100),
    shipper_province character varying(100),
    shipper_postal_code character varying(20),
    shipper_country character varying(100),
    receiver_name character varying(255),
    receiver_phone character varying(50),
    receiver_addr_line1 character varying(255),
    receiver_city character varying(100),
    receiver_province character varying(100),
    receiver_postal_code character varying(20),
    receiver_country character varying(100),
    weight_kg numeric(10,2),
    dimensions jsonb,
    final_cost numeric(10,2)
);


ALTER TABLE public.shipments OWNER TO tms_user;

--
-- 2025-11-10T09:55:45-05:00 Name: shipment_pricing_details; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE IF NOT EXISTS public.shipment_pricing_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid NOT NULL,
    applied_component_code character varying(100) NOT NULL,
    input_values jsonb DEFAULT '{}'::jsonb NOT NULL,
    calculated_amount numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(3) DEFAULT 'CAD'::character varying NOT NULL,
    component_type character varying(50) NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    calculation_formula text,
    execution_time integer DEFAULT 0 NOT NULL,
    calculated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE IF EXISTS ONLY public.shipment_pricing_details
    ADD CONSTRAINT shipment_pricing_details_pkey PRIMARY KEY (id);

ALTER TABLE IF EXISTS ONLY public.shipment_pricing_details
    ADD CONSTRAINT shipment_pricing_details_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_shipment_pricing_details_shipment_id ON public.shipment_pricing_details USING btree (shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_pricing_details_component_code ON public.shipment_pricing_details USING btree (applied_component_code);

--
-- Name: statements; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.statements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    type character varying(50) NOT NULL,
    reference_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    items jsonb NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    generated_at timestamp without time zone NOT NULL,
    generated_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.statements OWNER TO tms_user;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    domain character varying(255) NOT NULL,
    schema_name character varying(63) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tenants OWNER TO tms_user;

--
-- Name: timeline_events; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.timeline_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid,
    event_type character varying(50) NOT NULL,
    from_status character varying(50),
    to_status character varying(50),
    actor_type character varying(20) NOT NULL,
    actor_id uuid,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    extra jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.timeline_events OWNER TO tms_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    profile jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO tms_user;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: tms_user
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plate_number character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    capacity_kg numeric(10,2),
    status character varying(20) DEFAULT 'available'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vehicles OWNER TO tms_user;

--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: financial_records financial_records_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: proof_of_delivery proof_of_delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.proof_of_delivery
    ADD CONSTRAINT proof_of_delivery_pkey PRIMARY KEY (id);


--
-- Name: rule_executions rule_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.rule_executions
    ADD CONSTRAINT rule_executions_pkey PRIMARY KEY (id);


--
-- Name: rules rules_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_shipment_number_key; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_shipment_number_key UNIQUE (shipment_number);


--
-- Name: statements statements_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_domain_key; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_domain_key UNIQUE (domain);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_schema_name_key; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_schema_name_key UNIQUE (schema_name);


--
-- Name: timeline_events timeline_events_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_tenant_id_email_key; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- Name: idx_assignments_driver_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_assignments_driver_id ON public.assignments USING btree (driver_id);


--
-- Name: idx_assignments_shipment_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_assignments_shipment_id ON public.assignments USING btree (shipment_id);


--
-- Name: idx_customers_level; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_customers_level ON public.customers USING btree (level);


--
-- Name: idx_customers_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_customers_tenant_id ON public.customers USING btree (tenant_id);


--
-- Name: idx_drivers_status; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_drivers_status ON public.drivers USING btree (status);


--
-- Name: idx_drivers_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_drivers_tenant_id ON public.drivers USING btree (tenant_id);


--
-- Name: idx_drivers_vehicle_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_drivers_vehicle_id ON public.drivers USING btree (vehicle_id);


--
-- Name: idx_financial_records_reference_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_financial_records_reference_id ON public.financial_records USING btree (reference_id);


--
-- Name: idx_financial_records_status; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_financial_records_status ON public.financial_records USING btree (status);


--
-- Name: idx_financial_records_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_financial_records_tenant_id ON public.financial_records USING btree (tenant_id);


--
-- Name: idx_financial_records_type; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_financial_records_type ON public.financial_records USING btree (type);


--
-- Name: idx_notifications_shipment_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_notifications_shipment_id ON public.notifications USING btree (shipment_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_pod_shipment_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_pod_shipment_id ON public.proof_of_delivery USING btree (shipment_id);


--
-- Name: idx_rule_executions_rule_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_rule_executions_rule_id ON public.rule_executions USING btree (rule_id);


--
-- Name: idx_rule_executions_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_rule_executions_tenant_id ON public.rule_executions USING btree (tenant_id);


--
-- Name: idx_rules_priority; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_rules_priority ON public.rules USING btree (priority);


--
-- Name: idx_rules_status; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_rules_status ON public.rules USING btree (status);


--
-- Name: idx_rules_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_rules_tenant_id ON public.rules USING btree (tenant_id);


--
-- Name: idx_rules_type; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_rules_type ON public.rules USING btree (type);


--
-- Name: idx_shipments_customer_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_shipments_customer_id ON public.shipments USING btree (customer_id);


--
-- Name: idx_shipments_driver_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_shipments_driver_id ON public.shipments USING btree (driver_id);


--
-- Name: idx_shipments_shipment_number; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_shipments_shipment_number ON public.shipments USING btree (shipment_number);


--
-- Name: idx_shipments_status; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_shipments_status ON public.shipments USING btree (status);


--
-- Name: idx_shipments_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_shipments_tenant_id ON public.shipments USING btree (tenant_id);


--
-- Name: idx_statements_reference_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_statements_reference_id ON public.statements USING btree (reference_id);


--
-- Name: idx_statements_status; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_statements_status ON public.statements USING btree (status);


--
-- Name: idx_statements_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_statements_tenant_id ON public.statements USING btree (tenant_id);


--
-- Name: idx_statements_type; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_statements_type ON public.statements USING btree (type);


--
-- Name: idx_tenants_domain; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_tenants_domain ON public.tenants USING btree (domain);


--
-- Name: idx_tenants_schema_name; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_tenants_schema_name ON public.tenants USING btree (schema_name);


--
-- Name: idx_timeline_events_event_type; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_timeline_events_event_type ON public.timeline_events USING btree (event_type);


--
-- Name: idx_timeline_events_shipment_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_timeline_events_shipment_id ON public.timeline_events USING btree (shipment_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: tms_user
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: assignments assignments_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;


--
-- Name: assignments assignments_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- Name: customers customers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: drivers drivers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: drivers drivers_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: financial_records financial_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: notifications notifications_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- Name: proof_of_delivery proof_of_delivery_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.proof_of_delivery
    ADD CONSTRAINT proof_of_delivery_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- Name: rule_executions rule_executions_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.rule_executions
    ADD CONSTRAINT rule_executions_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.rules(id);


--
-- Name: rule_executions rule_executions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.rule_executions
    ADD CONSTRAINT rule_executions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: rules rules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: shipments shipments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: shipments shipments_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: shipments shipments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: statements statements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: timeline_events timeline_events_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tms_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 0SeMh0oQqMvqYvRotjQAiJgVnCmcPKlL66XOR5qg5sI3ArqkbxPYehjCRUWjOA4

