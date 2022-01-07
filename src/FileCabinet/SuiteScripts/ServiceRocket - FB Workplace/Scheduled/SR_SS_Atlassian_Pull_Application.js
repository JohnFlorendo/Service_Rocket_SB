/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/task'],
/**
 * @param{record} record
 * @param{task} task
 */
function(record, task) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
        var recAtlassian = record.load({
            type : 'customrecord_atlassian_summary',
            id : 4701
        });
        var ssTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
        ssTask.scriptId = 'customscript_sr_ss_fb_notify_error';
        ssTask.deploymentId = null;
        ssTask.params = {
            'custscript_wp_thread_id': '3817363574946957',
            'custscript_wp_thread_message': recAtlassian.getValue('custrecord_atlassum_message'),
            'custscript_wp_thread_records' : recAtlassian.getValue('custrecord_atlassum_error')
        };
        var ssTaskId = ssTask.submit();
        log.debug('ssTaskId',ssTaskId);
    }

    return {
        execute: execute
    };
    
});
