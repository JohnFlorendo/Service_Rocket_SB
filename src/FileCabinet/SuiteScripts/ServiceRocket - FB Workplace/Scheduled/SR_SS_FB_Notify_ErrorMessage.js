/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/runtime','../Library/Rocket_Lib_Helper.js'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    function(record, search,runtime,libHelper) {
        var currScript = runtime.getCurrentScript();
        function execute(scriptContext) {
            var stThreadId = currScript.getParameter('custscript_wp_thread_id');
            var stErrorMessage = currScript.getParameter('custscript_wp_thread_message');
            var wpConfigId = currScript.getParameter('custscript_wpr1p_config_access');
            var wpConfig = libHelper.WorkplaceConfiguration(wpConfigId);
            var objResponse = libHelper.createNewThread(wpConfig.Host,wpConfig.TokenKey,stThreadId,stErrorMessage);
            log.debug('objResponse',objResponse);

        }

        return {
            execute: execute
        };

    });
