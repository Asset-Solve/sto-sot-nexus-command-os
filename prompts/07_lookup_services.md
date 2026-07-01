# Prompt 07 — Connector-Backed Lookups

Replace every hard-coded dropdown, picker, autocomplete, chip selector, and default value with backend lookup APIs.

Endpoint pattern:
GET /api/v1/lookups/:objectType

Support tenantId, companyCode, plant, site, projectId, eventId, businessUnit, date, status, search, limit, sourceMode, parentObjectType, parentObjectId.

UI must show loading, empty, error, source-system badge, connector-mode badge, posting eligibility, last sync timestamp, and dependent filters.
