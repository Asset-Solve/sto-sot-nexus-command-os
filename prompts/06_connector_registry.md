# Prompt 06 — Connector Registry and Provisioning Console

Build object-aware connector registry and provisioning. Every connector must declare supported objects, actions, modes, auth, endpoints, mappings, retry policy, DLQ policy, health, last sync, payload preview support, and — for ERP connectors — `erpRole` (primary/backup), `cleanCoreLevel`, `apiCatalogRefs` (proof link), and `eventTopics`.

Include SAP S/4HANA (erpRole: primary), SAP BTP destinations, SAP Integration Suite (Cloud Integration, API Management, Edge Integration Cell), SAP Integration Suite advanced event mesh, Oracle Fusion REST/FBDI (erpRole: backup), Oracle Integration Cloud, Maximo, ServiceNow, AVEVA PI, OPC UA, ESRI, Primavera P6, ADP/UKG/WFS, Ariba/Fieldglass, OpenText, and generic REST/SFTP fallback.

Enforce the dual-ERP routing policy: one system of record per object per tenant, no dual-post, no automatic write failover (`docs/integration/DUAL_ERP_ROUTING_AND_FAILOVER_POLICY.md`).
