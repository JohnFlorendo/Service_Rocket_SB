/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/redirect', 'N/search', 'N/ui/serverWidget'],
    
    function (file, record, redirect, search, serverWidget) {
        
        function beforeLoad(scriptContext) {
            try {
                if (scriptContext.type !== scriptContext.UserEventType.VIEW) return;
                log.debug("start...");
                var recProject = scriptContext.newRecord;
                var intProjectId = recProject.id;
                var onClick = '';
                
                var form = scriptContext.form;
                log.debug("form", form)
                // Call the client script for the onclick function with message
                form.clientScriptModulePath  = '../Client/lcc_cs_project_ad_hoc.js';
                form.addButton({
                    id: 'custpage_sr_calculate_billable_contribution',
                    label: 'Calculate Billable Contribution',
                    functionName: 'updateField'
                });
              
                
            } catch (e) {
                log.debug("beforeload error:", e)
            }
        }
        
        function beforeSubmit(scriptContext) {
        
        }
        
        function afterSubmit(scriptContext) {
        
        }
        
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };
        
    });
