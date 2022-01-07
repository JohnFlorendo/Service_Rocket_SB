/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/file', 'N/format', 'N/record', 'N/redirect', 'N/render', 'N/search', 'N/task', 'N/ui/serverWidget'],
/**
 * @param{currentRecord} currentRecord
 * @param{file} file
 * @param{format} format
 * @param{record} record
 * @param{redirect} redirect
 * @param{render} render
 * @param{search} search
 */
function(currentRecord, file, format, record, redirect, render, search, task, serverWidget) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        try {
            var intProjectId = context.request.parameters.projectId;
            var scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_sr_mr_update_pr",
                deploymentId: null,
                params: {
                    custscript_project_id: intProjectId
                }
            });
    
            var scriptTaskId = scriptTask.submit();
            log.debug("scriptTaskId", scriptTaskId);
            while (task.checkStatus(scriptTaskId).status != task.TaskStatus.COMPLETE && task.checkStatus(scriptTaskId).status != task.TaskStatus.FAILED) {
                // Return to Suitelet as successful when the process is "Completed"
                context.response.write("success");
            }
        }catch (e){
            log.debug("onRequest error:", e);
        }
    }

    return {
        onRequest: onRequest
    };
    
});
