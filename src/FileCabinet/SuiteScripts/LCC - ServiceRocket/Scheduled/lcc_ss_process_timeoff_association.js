/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','../Library/lcc_lib_payroll.js', 'N/search', 'N/record'],
    function(runtime,libHelper, search, record) {
        var currScript = runtime.getCurrentScript();
        function execute(scriptContext) {
            try{
                var stTimeOffId = currScript.getParameter('custscript_param_timeoff_id');
                if(stTimeOffId){
                    var recTimeOffRequest = record.load({ type: "timeoffrequest", id: stTimeOffId, isDynamic: true });

                    if(recTimeOffRequest.getValue('approvalstatus') == 10 || recTimeOffRequest.getValue('approvalstatus') == 9) { //10 = Cancelled, 9 = Rejected
                        var arrTimeOffRequestAssociationIds = getTimeOffRequestAssociationId(stTimeOffId);
                        if(arrTimeOffRequestAssociationIds.length != 0) {
                            for(var intIndex in arrTimeOffRequestAssociationIds) {
                                var recTimeOffRequestAssociation = record.load({ type: "customrecord_sr_pc_time_off_assoc", id: arrTimeOffRequestAssociationIds[intIndex].recordid, isDynamic: true });
                                if(arrTimeOffRequestAssociationIds[intIndex].paycycle_status == 3) { // Confirmed
                                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_amount_of_time', parseFloat(recTimeOffRequestAssociation.getValue('custrecord_sr_pc_amount_of_time')) * -1);
                                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_for_reversal', true);
                                } else {
                                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_for_reversal', false);
                                }

                                recTimeOffRequestAssociation.setValue('custrecord_sr_pc_time_off_header', "");
                                recTimeOffRequestAssociation.setValue('custrecord_sr_pc_is_cancelled', true);
                                log.debug('Rejected/Cancelled ID', recTimeOffRequestAssociation.save());
                            }
                        }

                    } else {
                        var timeOffRequestAssociation = hasTimeOffRequestAssociation(stTimeOffId);
                        if(!timeOffRequestAssociation) {
                            var arrTimeOffTypes = [];
                            for(var intIndex=0; intIndex<recTimeOffRequest.getLineCount('detail'); intIndex++) {
                                if(recTimeOffRequest.getValue('employee') != '') {
                                    var flHourRate = 8;
                                    var fieldLookUpEmployee = search.lookupFields({
                                        type: 'employee',
                                        id: recTimeOffRequest.getValue('employee'),
                                        columns: ['custentity_payroll_provider','phone']
                                    });

                                    if(typeof fieldLookUpEmployee.custentity_payroll_provider[0] != 'undefined' && fieldLookUpEmployee.custentity_payroll_provider[0].value == "1") { flHourRate = 7.6; }
                                    var timeunit = recTimeOffRequest.getSublistValue('detail', 'timeunit', intIndex);
                                    var amountoftime = (timeunit == 'DAYS') ? parseFloat(parseFloat(recTimeOffRequest.getSublistValue('detail', 'amountoftime', intIndex)) * flHourRate) : recTimeOffRequest.getSublistValue('detail', 'amountoftime', intIndex);

                                    var recTimeOffRequestAssociation = record.create({ type: "customrecord_sr_pc_time_off_assoc", isDynamic: true });
                                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_time_off_record', stTimeOffId);
                                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_time_off_employee', recTimeOffRequest.getValue('employee'));
                                    recTimeOffRequestAssociation.setValue('custrecord_startdate', recTimeOffRequest.getSublistValue('detail', 'timeoffdate', intIndex));
                                    recTimeOffRequestAssociation.setValue('custrecord_enddate', recTimeOffRequest.getSublistValue('detail', 'timeoffdate', intIndex));
                                    recTimeOffRequestAssociation.setValue('custrecord_timeofftype', recTimeOffRequest.getSublistValue('detail', 'timeofftype', intIndex));
                                    recTimeOffRequestAssociation.setValue('custrecord_sr_pc_amount_of_time', amountoftime);
                                    log.debug('Association', recTimeOffRequestAssociation.save());
                                }
                            }
                        }
                    }
                }
            }catch (e) {
                log.debug('execute=>error',e);
            }
        }

        function getTimeOffRequestAssociationId(intTimeOffRequestId) {
            var intRecordId = "";
            var arrRecordIds = [];

            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [ ["custrecord_sr_pc_time_off_record","is",intTimeOffRequestId] ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_status", join:"custrecord_sr_pc_time_off_header" })
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result) {
                    // intRecordId = result.id;
                    arrRecordIds.push({
                        recordid: result.id,
                        paycycle_status: result.getValue({name: "custrecord_sr_pc_status", join:"custrecord_sr_pc_time_off_header"})
                    });

                    return true;
                });
            }

            return arrRecordIds;
        }

        function hasTimeOffRequestAssociation(intTimeOffRequestId) {
            var isExist = false;
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["custrecord_sr_pc_time_off_record","is",intTimeOffRequestId]
                    // , "AND", ["custrecord_sr_pc_time_off_header","anyof","@NONE@"]
                ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_header"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_employee"}),
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                isExist = true;
            }

            return isExist;
        }


        return {
            execute: execute
        };

    });
