/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/url','../Library/lcc_lib_timemaster.js'],
    /**
     * @param{task} task
     * @param{url} url
     */
    function(task, url,libTimeMaster) {
        function beforeLoad(scriptContext) { }

        function beforeSubmit(scriptContext) {
            if(scriptContext.type === scriptContext.UserEventType.DELETE){
                deleteTimeMaster(scriptContext);
            }
        }

        function afterSubmit(scriptContext) {
            if (scriptContext.newRecord.getValue('supervisorapproval')) {
                var timeMasterId = libTimeMaster.getTimeMasterRecordsByTimeId(scriptContext.newRecord.id);
                if (!timeMasterId) {
                    createTimeMaster(scriptContext);
                } else { log.debug('existing time master record', timeMasterId); }
            }
        }

        function createTimeMaster(scriptContext){
            try {
                var recTime = scriptContext.newRecord;
                var timeBillId = recTime.id;
                var chargeId = libTimeMaster.getChargeByTimeId(timeBillId);
                libTimeMaster.createTimeMaster(timeBillId, chargeId);

                // if(recTime.id){
                //     var ssTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                //     ssTask.scriptId = 'customscript_lcc_ss_timemaster_update';
                //     ssTask.deploymentId = null;
                //     ssTask.params = {'custscript_param_timerecord_id': recTime.id};
                //     var ssTaskId = ssTask.submit();
                //     log.debug('ssTaskId',ssTaskId);
                // }
            } catch (e) {
                log.debug('afterSubmit=>e',e);
            }
        }

        function deleteTimeMaster(scriptContext){
            var inTimeMaster = libTimeMaster.searchTimeMaster(scriptContext.newRecord.id);
            if(inTimeMaster){
                libTimeMaster.deleteTimeMasterById(inTimeMaster);
            }
        }
        return {
            beforeSubmit : beforeSubmit,
            afterSubmit: afterSubmit
        };

    });