    /**
     * @NApiVersion 2.x
     * @NScriptType UserEventScript
     * @NModuleScope SameAccount
     */
    define(['N/search', 'N/record', 'N/config', 'N/format', 'N/runtime', 'N/task'],
        /**
         * @param{task} task
         * @param{url} url
         */

        function(search, record, config, format, runtime, task) {

            var userObj = runtime.getCurrentUser();
            var stDatePreference = userObj.getPreference({ name: "dateformat"});

            function beforeSubmit(context) {
                var newRecord = context.newRecord;
                var arrCancelledRejected = ['10','9']; //10 = Cancelled, 9 = Rejected
                var stErrorMessage = "";
                var dtStartDate = getCurrentDateFormatBasedOnCompanySetup(newRecord.getValue('startdate'));
                var dtEndDate = getCurrentDateFormatBasedOnCompanySetup(newRecord.getValue('enddate'));
                var objTimeOffRequests = getTimeOffRequests(newRecord.getValue('employee'), dtStartDate, dtEndDate);

                log.debug('objTimeOffRequests', objTimeOffRequests);

                if(arrCancelledRejected.indexOf(newRecord.getValue('approvalstatus')) == -1) {
                    for(var intIndex=0; intIndex<newRecord.getLineCount('detail'); intIndex++) {
                        var dtTimeOffDate = getCurrentDateFormatBasedOnCompanySetup(newRecord.getSublistValue('detail', 'timeoffdate', intIndex));
                        var flAmountOfTime = newRecord.getSublistValue('detail', 'amountoftime', intIndex);
                        if(objTimeOffRequests[dtTimeOffDate] != null) {
                            var fieldLookUpWorkCalendar = search.lookupFields({
                                type: 'workcalendar',
                                id: objTimeOffRequests[dtTimeOffDate].workcalendar,
                                columns: ['workhoursperday']
                            });

                            log.debug('fieldLookUpWorkCalendar', fieldLookUpWorkCalendar.workhoursperday);
                            log.debug('flAmountOfTime', flAmountOfTime);

                            if(objTimeOffRequests[dtTimeOffDate].recordid != newRecord.id){
                                stErrorMessage += "Duplicate Time-off Request Record for Leave Dated: "+newRecord.getSublistValue('detail', 'timeoffdate', intIndex)+'.\n';
                            }
                        }
                    }

                    if(stErrorMessage != "") { throw stErrorMessage; }
                }

            }

            function afterSubmit(scriptContext) {
                var newRecord = scriptContext.newRecord;
                var ssTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                ssTask.scriptId = 'customscript_lcc_ss_process_timeoffassoc';
                ssTask.deploymentId = 'customdeploy_lcc_ss_process_timeoffassoc';
                ssTask.params = {'custscript_param_timeoff_id': newRecord.id};
                var ssTaskId = ssTask.submit();
            }

            function validateTimeOffDate(newRecord, intEmployeeId, dtTimeOffDate) {
                var arrData = [];
                var hasDuplicate = false;
                var timeoffrequestSearchObj = search.create({
                    type: "timeoffrequest",
                    filters:
                        [
                            ["employee.isinactive","is","F"], "AND",
                            ["approvalstatus","noneof","10","9"], "AND",
                            ["employee","anyof", intEmployeeId], "AND",
                            ["timeoffrequestdetail.timeoffdate","within",dtTimeOffDate,dtTimeOffDate]
                        ],
                    columns: [
                        search.createColumn({name: "employee", label: "Employee"}),
                        search.createColumn({name: "startdate", label: "Start Date"}),
                        search.createColumn({name: "timeofftype", label: "Time-Off Types"}),
                        search.createColumn({name: "enddate", label: "End Date"}),
                        search.createColumn({name: "amountoftime",join: "timeOffRequestDetail",label: "Amount of Time"}),
                        search.createColumn({name: "timeofftype",join: "timeOffRequestDetail",label: "Time-Off Type"}),
                        search.createColumn({name: "timeoffdate",join: "timeOffRequestDetail",label: "Time-Off Date"}),
                        search.createColumn({name: "timeunit",join: "timeOffRequestDetail",label: "Time Unit"})
                    ]
                });
                var searchResultCount = timeoffrequestSearchObj.runPaged().count;
                if(searchResultCount != 0) {
                    timeoffrequestSearchObj.run().each(function(result){
                        // if(newRecord.id != "") {
                            if(newRecord.id != result.id) {
                                hasDuplicate = true;
                            }
                        // }

                        return true;
                    });
                }
                return hasDuplicate;
            }

            function getTimeOffRequests(intEmployeeId, dtStartDate, dtEndDate) {
                var objData = {};
                var timeoffrequestSearchObj = search.create({
                    type: "timeoffrequest",
                    filters: [
                            ["employee.isinactive","is","F"], "AND",
                            ["approvalstatus","noneof","10","9"], "AND",
                            ["employee","anyof", intEmployeeId], "AND",
                            ["timeoffrequestdetail.timeoffdate","within",dtStartDate,dtEndDate]
                        ],
                    columns: [
                        search.createColumn({name: "employee", label: "Employee"}),
                        search.createColumn({name: "workcalendar", join: "employee", label: "Work Calendar"}),
                        search.createColumn({name: "startdate", label: "Start Date"}),
                        search.createColumn({name: "timeofftype", label: "Time-Off Types"}),
                        search.createColumn({name: "enddate", label: "End Date"}),
                        search.createColumn({name: "amountoftime",join: "timeOffRequestDetail",label: "Amount of Time"}),
                        search.createColumn({name: "timeofftype",join: "timeOffRequestDetail",label: "Time-Off Type"}),
                        search.createColumn({name: "timeoffdate",join: "timeOffRequestDetail",label: "Time-Off Date"}),
                        search.createColumn({name: "timeunit",join: "timeOffRequestDetail",label: "Time Unit"})
                    ]
                });
                var searchResultCount = timeoffrequestSearchObj.runPaged().count;
                if(searchResultCount != 0) {
                    timeoffrequestSearchObj.run().each(function(result){
                        var stTimeOffDate = getCurrentDateFormatBasedOnCompanySetup(getFormattedDate(result.getValue({name: "timeoffdate",join: "timeOffRequestDetail"})));
                        if(objData[stTimeOffDate] == null) { objData[stTimeOffDate] = {}; }
                        objData[stTimeOffDate] = {
                            recordid: result.id,
                            employee: result.getValue({name: "employee"}),
                            workcalendar: result.getValue({name: "workcalendar", join: "employee"}),
                            amountoftime: result.getValue({name: "amountoftime",join: "timeOffRequestDetail"}),
                            timeofftype: result.getValue({name: "timeofftype",join: "timeOffRequestDetail"}),
                            timeoffdate: stTimeOffDate,
                            timeunit: result.getValue({name: "timeunit",join: "timeOffRequestDetail"})
                        };

                        return true;
                    });
                }
                return objData;
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

            function getCurrentDateFormatBasedOnCompanySetup(dtDate) {
                var now = new Date(dtDate);
                var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                var objMonth = {
                    'Jan': 1,
                    'Feb': 2,
                    'Mar': 3,
                    'Apr': 4,
                    'May': 5,
                    'Jun': 6,
                    'Jul': 7,
                    'Aug': 8,
                    'Sep': 9,
                    'Oct': 10,
                    'Nov': 11,
                    'Dec': 12
                };
                var stDate = "";

                // var objCompanyPrefConfig = config.load({ type: config.Type.COMPANY_PREFERENCES, isDynamic: true });
                // var datePref = objCompanyPrefConfig.getValue({ fieldId: "DATEFORMAT" });

                switch (stDatePreference) {
                    case 'M/D/YYYY':
                    case 'MM/DD/YYYY':
                        stDate = Number(now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();
                        break;
                    case 'D/M/YYYY':
                    case 'DD/MM/YYYY':
                        stDate = now.getDate() + '/' +Number(now.getMonth()+1) + '/' + now.getFullYear();
                        break;
                    case 'D-Mon-YYYY':
                    case 'DD-Mon-YYYY':
                        stDate = now.getDate() + '-' +month_names_short[now.getMonth()] + '-' + now.getFullYear();
                        break;
                    case 'D.M.YYYY':
                    case 'DD.MM.YYYY':
                        stDate = now.getDate() + '.' +Number(now.getMonth()+1) + '.' + now.getFullYear();
                        break;
                    case 'D-MONTH-YYYY':
                    case 'DD-MONTH-YYYY':
                        stDate = now.getDate() + '-' +month_names[now.getMonth()] + '-' + now.getFullYear();
                        break;
                    case 'D MONTH, YYYY':
                    case 'DD MONTH, YYYY':
                        stDate = now.getDate() + ' ' +month_names[now.getMonth()] + ', ' + now.getFullYear();
                        break;
                    case 'YYYY/M/D':
                    case 'YYYY/MM/DD':
                        stDate = now.getFullYear() + '/' + Number(now.getMonth()+1) + '/' + now.getDate();
                        break;
                    case 'YYYY-M-D':
                    case 'YYYY-MM-DD':
                        stDate = now.getFullYear() + '-' + Number(now.getMonth()+1) + '-' + now.getDate();
                        break;
                }

                return format.format({value: stDate, type: format.Type.DATE});
            }

            function getFormattedDate(stDate) {
                var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                var objMonth = {
                    'Jan': 1,
                    'Feb': 2,
                    'Mar': 3,
                    'Apr': 4,
                    'May': 5,
                    'Jun': 6,
                    'Jul': 7,
                    'Aug': 8,
                    'Sep': 9,
                    'Oct': 10,
                    'Nov': 11,
                    'Dec': 12
                };

                switch (stDatePreference) {
                    case 'M/D/YYYY':
                    case 'MM/DD/YYYY':
                        var arrDate = stDate.split('/');
                        var strdate = new Date(arrDate[0] + '/' + arrDate[1] + '/' + arrDate[2]);
                        return strdate;
                        // return Number(strdate.getMonth()+1) + '/' + strdate.getDate() + '/' + strdate.getFullYear();
                        break;
                    case 'D/M/YYYY':
                    case 'DD/MM/YYYY':
                        var arrDate = stDate.split('/');
                        var strdate = new Date(arrDate[1] + '/' + arrDate[0] + '/' + arrDate[2]); //MM/DD/YYYY
                        return strdate;
                        // return strdate.getDate() + '/' +Number(strdate.getMonth()+1) + '/' + strdate.getFullYear();
                        break;
                    case 'D-Mon-YYYY':
                    case 'DD-Mon-YYYY':
                        var arrDate = stDate.split('-');
                        var strdate = new Date(objMonth[arrDate[1]] + '/' + arrDate[0] + '/' + arrDate[2]); //MM/DD/YYYY
                        return strdate;
                        // return strdate.getDate() + '-' +month_names_short[strdate.getMonth()] + '-' + strdate.getFullYear();
                        break;
                    case 'D.M.YYYY':
                    case 'DD.MM.YYYY':
                        var arrDate = stDate.split('.');
                        var strdate = new Date(arrDate[1] + '/' + arrDate[0] + '/' + arrDate[2]); //MM/DD/YYYY
                        return strdate;
                        // return strdate.getDate() + '.' +Number(strdate.getMonth()+1) + '.' + strdate.getFullYear();
                        break;
                    case 'D-MONTH-YYYY':
                    case 'DD-MONTH-YYYY':
                        var strdate = new Date(stDate); //MM/DD/YYYY
                        return strdate;
                        // return strdate.getDate() + '-' +month_names[strdate.getMonth()] + '-' + strdate.getFullYear();
                        break;
                    case 'D MONTH, YYYY':
                    case 'DD MONTH, YYYY':
                        var strdate = new Date(stDate); //MM/DD/YYYY
                        return strdate;
                        // return strdate.getDate() + ' ' +month_names[strdate.getMonth()] + ', ' + strdate.getFullYear();
                        break;
                    case 'YYYY/M/D':
                    case 'YYYY/MM/DD':
                        var arrDate = stDate.split('/');
                        var strdate = new Date(arrDate[1] + '/' + arrDate[2] + '/' + arrDate[0]); //MM/DD/YYYY
                        return strdate;
                        // return strdate.getFullYear() + '/' + Number(strdate.getMonth()+1) + '/' + strdate.getDate();
                        break;
                    case 'YYYY-M-D':
                    case 'YYYY-MM-DD':
                        var arrDate = stDate.split('-');
                        var strdate = new Date(arrDate[1] + '/' + arrDate[2] + '/' + arrDate[0]); //MM/DD/YYYY
                        return strdate;
                        // return strdate.getFullYear() + '-' + Number(strdate.getMonth()+1) + '-' + strdate.getDate();
                        break;
                }
            }

            return { afterSubmit: afterSubmit };

        });
