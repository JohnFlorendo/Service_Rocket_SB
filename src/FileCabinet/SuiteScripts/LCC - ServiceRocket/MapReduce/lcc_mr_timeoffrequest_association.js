/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/url', '../Library/lcc_lib_payroll'],
    function(search, record, runtime, url, libHelper) {
        var exports = {};

        function getInputData() {

            return search.create({
                type: "timeoffrequest",
                filters: [
                    ["startdate","onorafter","threemonthsago"], "AND",
                    // ["approvalstatus","anyof","8"], "AND",
                    ["approvalstatus","noneof","10","9"], "AND", //noneof Cancelled or Rejected
                    ["employee.isinactive","is","F"]
                    //,"AND",["enddate","onorbefore","thismonth"]
                ],
                columns: [
                    search.createColumn({ name: "internalid", sort: search.Sort.ASC, label: "Internal ID" }),
                    search.createColumn({name: "employee", label: "Employee"}),
                    search.createColumn({name: "startdate", label: "Start Date"}),
                    search.createColumn({name: "timeofftype", label: "Time-Off Types"}),
                    search.createColumn({name: "enddate", label: "End Date"})
                ]
            });
        }

        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);
                var timeOffRequestAssociation = hasTimeOffRequestAssociation(searchResult.id);

                if(!timeOffRequestAssociation) {
                    var arrTimeOffRequests = getApprovedTimeOffRequestsDetails(searchResult.id);
                    if(arrTimeOffRequests.length != 0) {

                        var objTimeOffTypes = libHelper.getTimeOffTypes();
                        var arrTimeOffTypes = [];
                        for(var intIndex=0; intIndex<arrTimeOffRequests.length; intIndex++) {
                            // arrTimeOffTypes.push(objTimeOffTypes[arrTimeOffRequests[intIndex].timeofftype].recordid);

                            var recTimeOffRequestAssociation = record.create({ type: "customrecord_sr_pc_time_off_assoc", isDynamic: true });
                            recTimeOffRequestAssociation.setValue('custrecord_sr_pc_time_off_record', searchResult.id);
                            recTimeOffRequestAssociation.setValue('custrecord_sr_pc_time_off_employee', searchResult.values.employee.value);
                            recTimeOffRequestAssociation.setValue('custrecord_startdate', libHelper.getFormattedDate(arrTimeOffRequests[intIndex].timeoffdate));
                            recTimeOffRequestAssociation.setValue('custrecord_enddate', libHelper.getFormattedDate(arrTimeOffRequests[intIndex].timeoffdate));
                            recTimeOffRequestAssociation.setValue('custrecord_timeofftype', objTimeOffTypes[arrTimeOffRequests[intIndex].timeofftype].recordid);
                            recTimeOffRequestAssociation.setValue('custrecord_sr_pc_amount_of_time', arrTimeOffRequests[intIndex].amountoftime);
                            recTimeOffRequestAssociation.save();
                        }

                    }
                }

            } catch(e) { log.debug('ERROR', e); }
        }

        function hasTimeOffRequestAssociation(intTimeOffRequestId) {
            var isExist = false;
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["custrecord_sr_pc_time_off_record","is",intTimeOffRequestId]
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

        function getApprovedTimeOffRequestsDetails(intTimeOffRequestId) {
            var arrTimeOffRequests = [];
            var timeoffrequestSearchObj = search.create({
                type: "timeoffrequest",
                filters: [
                    ["internalid","is",intTimeOffRequestId]
                ],
                columns: [
                    search.createColumn({name: "internalid"}),
                    search.createColumn({name: "employee"}),
                    search.createColumn({name: "startdate"}),
                    search.createColumn({name: "enddate"}),
                    search.createColumn({name: "amountoftime",join: "timeOffRequestDetail"}),
                    search.createColumn({name: "timeofftype",join: "timeOffRequestDetail"}),
                    search.createColumn({ name: "timeunit", join: "timeOffRequestDetail", sort: search.Sort.ASC}),
                    search.createColumn({ name: "timeoffdate", join: "timeOffRequestDetail"})
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){
                    if(result.getValue({ name: "employee"}) != '') {
                        var flHourRate = 8;
                        var fieldLookUpEmployee = search.lookupFields({
                            type: 'employee',
                            id: result.getValue({ name: "employee"}),
                            columns: ['custentity_payroll_provider']
                        });

                        log.debug(result.getValue({ name: "employee"}), fieldLookUpEmployee);
                        
                        if(fieldLookUpEmployee.custentity_payroll_provider.length != 0) {
                            if(fieldLookUpEmployee.custentity_payroll_provider[0].value == "1") { flHourRate = 7.6; }
                        }

                        var timeunit = result.getValue({ name: "timeunit",join: "timeOffRequestDetail" });
                        var amountoftime = (timeunit == 'DAYS') ? parseFloat(parseFloat(result.getValue({ name: "amountoftime", join: "timeOffRequestDetail"})) * flHourRate) : result.getValue({ name: "amountoftime", join: "timeOffRequestDetail"});

                        arrTimeOffRequests.push({
                            recordid: result.getValue({ name: "internalid"}),
                            employee: result.getValue({ name: "employee"}),
                            startdate: result.getValue({ name: "startdate"}),
                            enddate: result.getValue({ name: "enddate"}),
                            timeofftype: result.getValue({ name: "timeofftype",join: "timeOffRequestDetail" }),
                            timeoffdate: result.getValue({ name: "timeoffdate",join: "timeOffRequestDetail" }),
                            timeunit: timeunit,
                            amountoftime: amountoftime,
                            recordid_timeofftype: result.getValue({ name: "internalid"})+'_'+result.getValue({ name: "timeofftype",join: "timeOffRequestDetail" })
                        });
                    }
                    return true;
                });
            }

            return arrTimeOffRequests;
        }

        return {
            getInputData : getInputData,
            map : map
        };
    });