/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/record','../Library/lcc_lib_timemaster.js'],
    function(record,libHelper) {

        function execute(scriptContext) {
            try {
                // var intChargeId = 2403925;
                // var rec = record.load({
                //    type: 'charge',
                //    id: intChargeId,
                //    isDynamic: true
                // });
                //
                // /** CREATE TIME **/
                // rec.setValue('use', 'Actual');
                // rec.setValue('rate', rec.getValue('rate'));
                // rec.setValue('amount', rec.getValue('amount'));
                // rec.setValue('quantity', rec.getValue('quantity'));
                // rec.save(false, true);
                //
                // var intChargeId = 2400043;
                // var objRecord = record.copy({
                //     type: record.Type.CHARGE,
                //     id: intChargeId,
                //     isDynamic: true
                // });

                // objRecord.setValue('use', 'Actual');
                // objRecord.setValue('timerecord', 1870160);
                // objRecord.setValue('rate', objRecord.getValue('rate'));
                // objRecord.setValue('amount', objRecord.getValue('amount'));
                // objRecord.setValue('quantity', objRecord.getValue('quantity'));
                // log.debug('copy charge', objRecord.save(false, true));

                var intChargeId = 2403918;
                record.delete({
                    type: record.Type.CHARGE,
                    id: intChargeId,
                });

            } catch (e) {
                log.debug('execute=>error',e);
            }
        }

        return {
            execute: execute
        };

    });
