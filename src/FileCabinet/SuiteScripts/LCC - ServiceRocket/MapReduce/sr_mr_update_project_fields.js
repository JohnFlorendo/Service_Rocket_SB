/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', '../Library/lcc_lib_project.js'],
    
    function (runtime, libHelper) {
        var currScript = runtime.getCurrentScript();
        
        function getInputData() {
            var arrResult = [];
            try {
                var intProjectId = (currScript.getParameter('custscript_project_id')) ? currScript.getParameter('custscript_project_id') : "";
                log.debug("getinputdata",intProjectId);
                arrResult = libHelper.consolidateProject(intProjectId);
                log.debug("getinputdata arrResult", arrResult);
            } catch (e) {
                log.debug("getInputData error:", e);
            }
            return arrResult;
        }
        
        function map(context) {
            try {
                context.write({
                    key: context.key,
                    value: context.value
                });
            } catch (e) {
                log.debug("error map", e);
            }
        }
        
        function reduce(context) {
            var intProjectId = JSON.parse(context.values[0]).internalid;
            log.debug("reduce intProjectid", intProjectId);
            try {
                if(intProjectId) {
                    libHelper.loadProjectRecord(intProjectId);
                }
            } catch (e) {
                log.debug("error reduce", e);
            }
        }
        
        function summarize(summary) {
            try {
                var errorCount = 0;
                var arrErrorMessage = [];
                summary.output.iterator().each(function (key, value) {
                    var objResults = JSON.parse(value);
                    if (objResults.hasError == true) {
                        arrErrorMessage.push({
                            projectId: objResults.projectId,
                            status: objResults.status,
                            errorMessage: objResults.errorMessage
                            
                        });
                        errorCount++;
                    }
                    return true;
                });
                
                log.debug("create record:", arrErrorMessage);
                //CREATE RECORD
                libHelper.projectMRLog(arrErrorMessage, errorCount.toString());
            } catch (e) {
                log.debug('summarize error:', e);
            }
            
        }
        
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
        
    }
);
