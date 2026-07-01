# Process Decomposition Template

| Capability | Process | Subprocess | Task | Activity | Trigger | Actor | Source Object | Target Object | System of Record | Action Type | Approval | Exception Path | Audit Event |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Example | Maintenance Execution | Confirm Work | Enter operation confirmation | Review labor and status | Work complete | Technician | Work Order Operation | Confirmation | SAP S/4 EAM | Create | Supervisor if exception | Correction confirmation | confirmation.submitted |

## Required decomposition levels

- L0 Business domain
- L1 Capability
- L2 Process
- L3 Subprocess
- L4 Task
- L5 Activity
- L6 Workflow step
- L7 System action
- L8 Integration payload
- L9 Audit/evidence event
