/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/file'],
    /**
     * @param{task} task
     * @param{url} url
     */
    function(task, file) {

        function beforeSubmit(scriptContext) {
            var newRecord = scriptContext.newRecord;
            log.debug('timeitem', newRecord.getLineCount('timeitem'));

            // var fileObj = file.create({
            //     name: 'newRecord.txt',
            //     fileType: file.Type.PLAINTEXT,
            //     contents: JSON.stringify(newRecord),
            //     folder: -15
            // });
            // fileObj.save();
        }

        return { beforeSubmit: beforeSubmit };

    });
