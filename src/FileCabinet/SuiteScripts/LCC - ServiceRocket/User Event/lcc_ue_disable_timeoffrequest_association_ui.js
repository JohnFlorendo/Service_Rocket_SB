/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record','N/search','N/runtime', 'N/ui/message', 'N/ui/serverWidget', '../Library/lcc_lib_payroll'],
    function(record,search,runtime, message,serverWidget, libHelper) {
        function beforeLoad(context) {
            var newRecord = context.newRecord;
            var form = context.form;

            if(context.type == 'create' || context.type == 'edit') {
                throw 'CANNOT ACCESS USER INTERFACE.';
            }
        }

        return { beforeLoad: beforeLoad };

    });