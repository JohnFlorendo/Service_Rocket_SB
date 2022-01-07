define(['N/record', 'N/search', 'N/config','N/file','N/runtime', 'N/format','N/url'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{config} config
     * @param{file} file
     */
    function(record, search, config,file,runtime, format,url) {
        var userObj = runtime.getCurrentUser();
        var stDatePreference = userObj.getPreference({ name: "dateformat"});
        var defaultStandardHoursOtherPayrollProviders = 173.33;
        var defaultStandardHoursAussiePay = 164.66;
        var fn = {};

        fn.getEmployeeWorkCalendar = function(intEmployeeId) {
            var objWorkCalender = {
                intWorkCalender: "",
                name: ""
            };
            var employeeSearchObj = search.create({
                type: "employee",
                filters: ["internalid", "anyof", [intEmployeeId]],
                columns: [
                    search.createColumn({
                        name: "firstname"
                    }),
                    search.createColumn({
                        name: "middlename"
                    }),
                    search.createColumn({
                        name: "lastname"
                    }),
                    search.createColumn({
                        name: "workcalendar"
                    }),
                ]
            });

            var searchResultCount = employeeSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                employeeSearchObj.run().each(function(result) {
                    objWorkCalender.intWorkCalender = result.getValue({
                        name: "workcalendar"
                    });
                    objWorkCalender.name = result.getValue({
                        name: "firstname"
                    }) + ' ' + result.getValue({
                        name: "middlename"
                    }) + ' ' + result.getValue({
                        name: "lastname"
                    });
                    return true;
                });
            }

            return objWorkCalender;

        }

        fn.getWorkCalendar = function(intWorkCalendar) {
            var objWorkCalendar = {};
            var workCalendarSearchObj = search.create({
                type: "workcalendar",
                filters: ["internalid", "anyof", [intWorkCalendar]],
                columns: [
                    search.createColumn({
                        name: "workhoursperday"
                    }),
                    search.createColumn({
                        name: "sunday"
                    }),
                    search.createColumn({
                        name: "monday"
                    }),
                    search.createColumn({
                        name: "tuesday"
                    }),
                    search.createColumn({
                        name: "wednesday"
                    }),
                    search.createColumn({
                        name: "thursday"
                    }),
                    search.createColumn({
                        name: "friday"
                    }),
                    search.createColumn({
                        name: "saturday"
                    })
                ]
            });

            var searchResultCount = workCalendarSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                workCalendarSearchObj.run().each(function(result) {
                    objWorkCalendar['workhoursperday'] = result.getValue({
                        name: "workhoursperday"
                    });
                    objWorkCalendar[0] = result.getValue({
                        name: "sunday"
                    });
                    objWorkCalendar[1] = result.getValue({
                        name: "monday"
                    });
                    objWorkCalendar[2] = result.getValue({
                        name: "tuesday"
                    });
                    objWorkCalendar[3] = result.getValue({
                        name: "wednesday"
                    });
                    objWorkCalendar[4] = result.getValue({
                        name: "thursday"
                    });
                    objWorkCalendar[5] = result.getValue({
                        name: "friday"
                    });
                    objWorkCalendar[6] = result.getValue({
                        name: "saturday"
                    });
                    return true;
                });
            }

            return objWorkCalendar;
        }

        fn.getNonWorkingHolidays = function(intWorkCalendar) {
            var objNonWorkingHoldings = {};
            var workCalendarSearchObj = search.create({
                type: "workcalendar",
                filters: ["internalid", "anyof", [intWorkCalendar]],
                columns: [
                    search.createColumn({
                        name: "exceptiondate"
                    }),
                    search.createColumn({
                        name: "exceptiondescription"
                    }),
                ]
            });

            var searchResultCount = workCalendarSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                workCalendarSearchObj.run().each(function(result) {
                    var stExceptionDate = getFormattedDate(result.getValue({
                        name: "exceptiondate"
                    }));
                    if (objNonWorkingHoldings[stExceptionDate] == null) {
                        objNonWorkingHoldings[stExceptionDate] = result.getValue({
                            name: "exceptiondescription"
                        });
                    }

                    return true;
                });
            }

            return objNonWorkingHoldings;
        }

        fn.getFormattedDate = function(stDate) {
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

            // var objCompanyPrefConfig = config.load({
            //     type: config.Type.COMPANY_PREFERENCES,
            //     isDynamic: true
            // });
            // var datePref = objCompanyPrefConfig.getValue({
            //     fieldId: "DATEFORMAT"
            // });

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

        fn.getCurrentDateFormatBasedOnCompanySetup = function() {
            var now = new Date();
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

            var objCompanyPrefConfig = config.load({ type: config.Type.COMPANY_PREFERENCES, isDynamic: true });
            var datePref = objCompanyPrefConfig.getValue({ fieldId: "DATEFORMAT" });
            var stDate = "";

            switch (datePref) {
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

            return format.parse({value: stDate, type: format.Type.DATE});
        }

        fn.getCurrentDateFormatBasedOnUserSetup = function() {
            var now = new Date();
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

            // var objCompanyPrefConfig = config.load({ type: config.Type.COMPANY_PREFERENCES, isDynamic: true });
            // var datePref = objCompanyPrefConfig.getValue({ fieldId: "DATEFORMAT" });
            var stDate = "";

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

            return format.parse({value: stDate, type: format.Type.DATE});
        }

        fn.getDateFormatBasedOnCompanySetup = function(stDate) {
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

            var objCompanyPrefConfig = config.load({ type: config.Type.COMPANY_PREFERENCES, isDynamic: true });
            var datePref = objCompanyPrefConfig.getValue({ fieldId: "DATEFORMAT" });

            switch (datePref) {
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
                    var strdate =arrDate[1] + '/' + arrDate[2] + '/' + arrDate[0]; //MM/DD/YYYY
                    return strdate;
                    // return strdate.getFullYear() + '/' + Number(strdate.getMonth()+1) + '/' + strdate.getDate();
                    break;
                case 'YYYY-M-D':
                case 'YYYY-MM-DD':
                    var arrDate = stDate.split('-');
                    var strdate = arrDate[1] + '/' + arrDate[2] + '/' + arrDate[0]; //MM/DD/YYYY
                    return strdate;
                    // return strdate.getFullYear() + '-' + Number(strdate.getMonth()+1) + '-' + strdate.getDate();
                    break;
            }

            // return format.parse({value: stDate, type: format.Type.DATE});
        }

        fn.getAllWorkCalendarValues = function(intWorkCalendar) {
            var objWorkCalendar = {};
            var workCalendarSearchObj = search.create({
                type: "workcalendar",
                filters: ["internalid", "anyof", [intWorkCalendar]],
                columns: [
                    search.createColumn({
                        name: "workhoursperday"
                    }),
                    search.createColumn({
                        name: "sunday"
                    }),
                    search.createColumn({
                        name: "monday"
                    }),
                    search.createColumn({
                        name: "tuesday"
                    }),
                    search.createColumn({
                        name: "wednesday"
                    }),
                    search.createColumn({
                        name: "thursday"
                    }),
                    search.createColumn({
                        name: "friday"
                    }),
                    search.createColumn({
                        name: "saturday"
                    })
                ]
            });

            var searchResultCount = workCalendarSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                workCalendarSearchObj.run().each(function(result) {
                    if (objWorkCalendar[result.id] == null) {
                        objWorkCalendar[result.id] = {};
                        objWorkCalendar[result.id]['workhoursperday'] = result.getValue({
                            name: "workhoursperday"
                        });
                        objWorkCalendar[result.id][0] = result.getValue({
                            name: "sunday"
                        });
                        objWorkCalendar[result.id][1] = result.getValue({
                            name: "monday"
                        });
                        objWorkCalendar[result.id][2] = result.getValue({
                            name: "tuesday"
                        });
                        objWorkCalendar[result.id][3] = result.getValue({
                            name: "wednesday"
                        });
                        objWorkCalendar[result.id][4] = result.getValue({
                            name: "thursday"
                        });
                        objWorkCalendar[result.id][5] = result.getValue({
                            name: "friday"
                        });
                        objWorkCalendar[result.id][6] = result.getValue({
                            name: "saturday"
                        });
                    }

                    return true;
                });
            }

            return objWorkCalendar;
        }

        fn.getAllNonWorkingHolidaysValues = function(intWorkCalendar) {
            var objNonWorkingHoldings = {};
            var workCalendarSearchObj = search.create({
                type: "workcalendar",
                filters: ["internalid", "anyof", [intWorkCalendar]],
                columns: [
                    search.createColumn({
                        name: "exceptiondate"
                    }),
                    search.createColumn({
                        name: "exceptiondescription"
                    }),
                ]
            });

            var searchResultCount = workCalendarSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                workCalendarSearchObj.run().each(function(result) {
                    if (objNonWorkingHoldings[result.id] == null) {
                        objNonWorkingHoldings[result.id] = {};
                        var stExceptionDate = fn.getFormattedDate(result.getValue({
                            name: "exceptiondate"
                        }));
                        if (objNonWorkingHoldings[result.id][stExceptionDate] == null) {
                            objNonWorkingHoldings[result.id][stExceptionDate] = result.getValue({
                                name: "exceptiondescription"
                            });
                        }
                    }
                    return true;
                });
            }

            return objNonWorkingHoldings;
        }

        fn.getAllEmployeesPayroll = function(dtStartDate, dtEndDate, payrollprovider) {
            try {
                var objEmployees = {};
                var arrEmpId = [];
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters: [
                        ["custentity_payroll_provider", "anyof", [payrollprovider]], "AND",
                        ["isinactive", "is", 'F']
                    ],
                    columns: [
                        search.createColumn({ name: "entityid", sort: search.Sort.ASC }),
                        "job",
                        "custentity_employee_number",
                        "department",
                        "firstname",
                        "middlename",
                        "lastname",
                        "workcalendar",
                        "custentity_overwrite_standard_hour"
                    ]
                });
                employeeSearchObj.run().each(function(result) {

                    var costText = result.getText('department');
                    var objEmployee = {};
                    var flStandardHour = (result.getValue('custentity_overwrite_standard_hour') == "") ? defaultStandardHoursOtherPayrollProviders : result.getValue('custentity_overwrite_standard_hour');
                    if(payrollprovider == 1) {
                        flStandardHour = (result.getValue('custentity_overwrite_standard_hour') == "") ? defaultStandardHoursAussiePay : result.getValue('custentity_overwrite_standard_hour');
                    }

                    objEmployee.id = result.id;
                    objEmployee.name = result.getValue('entityid');
                    objEmployee.code = result.getValue('custentity_employee_number');
                    objEmployee.cost_center = (costText)? costText.split(':')[costText.split(':').length-1] : '';
                    objEmployee.standard_hour = flStandardHour;
                    objEmployee.paycode_id = '';
                    objEmployee.quantity = 0;
                    objEmployee.payroll_start = '';
                    objEmployee.payroll_end = '';
                    objEmployee.leave_start = '';
                    objEmployee.leave_end = '';
                    objEmployee.number_pays = '1.00';
                    objEmployee.alter_rate = 0;
                    objEmployee.workcalendar_id = result.getValue('workcalendar');
                    objEmployee.workcalendar_name = result.getValue({
                        name: "firstname"
                    }) + ' ' + result.getValue({
                        name: "middlename"
                    }) + ' ' + result.getValue({
                        name: "lastname"
                    });
                    objEmployee.workcalendar_object = {};
                    objEmployee.workholdays_object = {};
                    objEmployee.total_working_hours = flStandardHour;

                    if (objEmployees[objEmployee.id] == null) {
                        arrEmpId.push(objEmployee.id);
                        objEmployees[objEmployee.id] = objEmployee;
                    }
                    return true;
                });

                //GET ALL CALENDAR VALUES AND HOLIDAYS
                var objAllWorkCalendars = fn.getAllWorkCalendarValues(arrEmpId);
                var objAllWorkCalendarsHolidays = fn.getAllNonWorkingHolidaysValues(arrEmpId);

                //MAP TO THE EMPLOYEE RECORDS
                for (var objEmployee in objEmployees) {

                    if (objAllWorkCalendars[objEmployees[objEmployee].workcalendar_id]) {
                        objEmployees[objEmployee].workcalendar_object = objAllWorkCalendars[objEmployees[objEmployee].workcalendar_id];
                        objEmployees[objEmployee].workholdays_object = objAllWorkCalendarsHolidays[objEmployees[objEmployee].workcalendar_id];
                        objEmployees[objEmployee].payroll_start = fn.getFormattedDate(dtStartDate);
                        objEmployees[objEmployee].payroll_end = fn.getFormattedDate(dtEndDate);

                        /** Loop the two dates **/
                        var intNumberOfWorkingDays = 0;
                        var intNumberOfNonWorkingDays = 0;
                        for (var dt =  objEmployees[objEmployee].payroll_start; dt <=  objEmployees[objEmployee].payroll_end; dt.setDate(dt.getDate() + 1)) {

                            /** Check Working Day based on the schedule in the Work Calendar **/
                            if (objEmployees[objEmployee].workcalendar_object[dt.getDay()]) {
                                intNumberOfWorkingDays += 1;
                            }

                            /** Check Non-Working Day based on the schedule in the Work Calendar **/
                            if (objEmployees[objEmployee].workholdays_object[dt] != null) {
                                intNumberOfNonWorkingDays += 1;
                            }
                        }

                        var totalWorkingHours = parseFloat(objEmployees[objEmployee].workcalendar_object.workhoursperday) * intNumberOfWorkingDays;
                        var totalNonWorkingHours = parseFloat(objEmployees[objEmployee].workcalendar_object.workhoursperday) * intNumberOfNonWorkingDays;
                        var intAverageWH = totalWorkingHours - totalNonWorkingHours;
                        var averageWorkingHours = intAverageWH.toFixed(2);

                        if(objEmployees[objEmployee].standard_hour == "") {
                            objEmployees[objEmployee].total_working_hours = averageWorkingHours;
                        }
                    }

                    // log.debug('objEmployee :: '+objEmployee, objEmployees[objEmployee]);
                }


            } catch (e) {
                log.debug('getEmployeesPayroll', e);
            }

            return objEmployees;
        }

        fn.getEmployeePayroll = function(intEmployeeId, dtStartDate, dtEndDate, payrollprovider) {
            try {
                var objEmployees = {};
                var arrEmpId = [];
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters: [
                        ["custentity_payroll_provider", "anyof", payrollprovider], "AND",
                        ["internalid", "anyof", intEmployeeId], "AND",
                        ["isinactive", "is", 'F']
                    ],
                    columns: [
                        "entityid",
                        "job",
                        "custentity_employee_number",
                        "department",
                        "firstname",
                        "middlename",
                        "lastname",
                        "workcalendar",
                        "custentity_overwrite_standard_hour"
                    ]
                });
                employeeSearchObj.run().each(function(result) {

                    var costText = result.getText('department');
                    var objEmployee = {};
                    var flStandardHour = (result.getValue('custentity_overwrite_standard_hour') == "") ? defaultStandardHoursOtherPayrollProviders : result.getValue('custentity_overwrite_standard_hour');
                    if(payrollprovider == 1) {
                        flStandardHour = (result.getValue('custentity_overwrite_standard_hour') == "") ? defaultStandardHoursAussiePay : result.getValue('custentity_overwrite_standard_hour');
                    }

                    objEmployee.id = result.id;
                    objEmployee.name = result.getValue('entityid');
                    objEmployee.code = result.getValue('custentity_employee_number');
                    objEmployee.cost_center = (costText)? costText.split(':')[costText.split(':').length-1] : '';
                    objEmployee.standard_hour = flStandardHour;
                    objEmployee.paycode_id = '';
                    objEmployee.quantity = 0;
                    objEmployee.payroll_start = '';
                    objEmployee.payroll_end = '';
                    objEmployee.leave_start = '';
                    objEmployee.leave_end = '';
                    objEmployee.number_pays = '1.00';
                    objEmployee.alter_rate = 0;
                    objEmployee.workcalendar_id = result.getValue('workcalendar');
                    objEmployee.workcalendar_name = result.getValue({
                        name: "firstname"
                    }) + ' ' + result.getValue({
                        name: "middlename"
                    }) + ' ' + result.getValue({
                        name: "lastname"
                    });
                    objEmployee.workcalendar_object = {};
                    objEmployee.workholdays_object = {};
                    objEmployee.total_working_hours = flStandardHour;

                    if (objEmployees[objEmployee.id] == null) {
                        arrEmpId.push(objEmployee.id);
                        objEmployees[objEmployee.id] = objEmployee;
                    }
                    return true;
                });

                //GET ALL CALENDAR VALUES AND HOLIDAYS
                var objAllWorkCalendars = fn.getAllWorkCalendarValues(arrEmpId);
                var objAllWorkCalendarsHolidays = fn.getAllNonWorkingHolidaysValues(arrEmpId);

                //MAP TO THE EMPLOYEE RECORDS
                for (var objEmployee in objEmployees) {

                    if (objAllWorkCalendars[objEmployees[objEmployee].workcalendar_id]) {
                        objEmployees[objEmployee].workcalendar_object = objAllWorkCalendars[objEmployees[objEmployee].workcalendar_id];
                        objEmployees[objEmployee].workholdays_object = objAllWorkCalendarsHolidays[objEmployees[objEmployee].workcalendar_id];
                        objEmployees[objEmployee].payroll_start = fn.getFormattedDate(dtStartDate);
                        objEmployees[objEmployee].payroll_end = fn.getFormattedDate(dtEndDate);

                        /** Loop the two dates **/
                        var intNumberOfWorkingDays = 0;
                        var intNumberOfNonWorkingDays = 0;
                        for (var dt =  objEmployees[objEmployee].payroll_start; dt <=  objEmployees[objEmployee].payroll_end; dt.setDate(dt.getDate() + 1)) {

                            /** Check Working Day based on the schedule in the Work Calendar **/
                            if (objEmployees[objEmployee].workcalendar_object[dt.getDay()]) {
                                intNumberOfWorkingDays += 1;
                            }

                            /** Check Non-Working Day based on the schedule in the Work Calendar **/
                            if (objEmployees[objEmployee].workholdays_object[dt] != null) {
                                intNumberOfNonWorkingDays += 1;
                            }
                        }

                        var totalWorkingHours = parseFloat(objEmployees[objEmployee].workcalendar_object.workhoursperday) * intNumberOfWorkingDays;
                        var totalNonWorkingHours = parseFloat(objEmployees[objEmployee].workcalendar_object.workhoursperday) * intNumberOfNonWorkingDays;
                        var intAverageWH = totalWorkingHours - totalNonWorkingHours;
                        var averageWorkingHours = intAverageWH.toFixed(2);

                        if(objEmployees[objEmployee].standard_hour == "") {
                            objEmployees[objEmployee].total_working_hours = averageWorkingHours;
                        }
                    }

                    // log.debug('objEmployee :: '+objEmployee, objEmployees[objEmployee]);
                }


            } catch (e) {
                log.debug('getEmployeesPayroll', e);
            }

            return objEmployees;
        }

        fn.createPayCycle = function(objData) {
            var recPayCycle = record.create({ type: "customrecord_sr_pay_cycle", isDynamic: true });
            recPayCycle.setValue('custrecord_sr_pc_start_date', format.parse({ value: objData.startdate, type: format.Type.DATE }));
            recPayCycle.setValue('custrecord_sr_pc_end_date', format.parse({ value: objData.enddate, type: format.Type.DATE }));
            recPayCycle.setValue('custrecord_sr_pc_memo', objData.memo);
            recPayCycle.setValue('custrecord_payroll_provider', objData.payrollprovider);
            recPayCycle.setValue('custrecord_sr_pc_csv_file', objData.fileid);
            recPayCycle.setValue('custrecord_generatedby', objData.generatedby);
            // recPayCycle.setValue('custrecord_sr_pc_status', objData.stPayCycleStatus);

            // if(objData.stForcastedData != "") {
            //     var objForcastedData = JSON.parse(objData.stForcastedData);
            //     recPayCycle.setValue('custrecord_sr_pc_forcasted_payroll_value', objForcastedData.forcasted_payroll_value);
            //     recPayCycle.setValue('custrecord_sr_pc_forcasted_payment_date', format.parse({ value: objForcastedData.forcasted_payment_date, type: format.Type.DATE }));
            // }

            return recPayCycle.save();
        }

        fn.getTimeOffRequestsAssociation = function(arrEmployeeList, dtStartDate, dtEndDate) {
            var arrTimeOffRequestsAssociation = [];
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["isinactive","anyof","F"], "AND",
                    ["custrecord_sr_pc_time_off_header","anyof","@NONE@"], "AND",
                    ["custrecord_sr_pc_time_off_employee","anyof",arrEmployeeList], "AND",
                    ["custrecord_startdate","onorafter",[format.format({ value: dtStartDate, type: format.Type.DATE })]], "AND",
                    ["custrecord_enddate","onorbefore",[format.format({ value: dtEndDate, type: format.Type.DATE })]]
                ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_record"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_employee"}),
                    search.createColumn({ name: "custrecord_timeofftype_paycode"}),
                    search.createColumn({ name: "custrecord_timeofftype"}),
                    search.createColumn({ name: "custrecord_startdate"}),
                    search.createColumn({ name: "custrecord_enddate"}),
                    search.createColumn({ name: "custrecord_sr_pc_amount_of_time"})
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){
                    arrTimeOffRequestsAssociation.push({
                        recordid: result.id,
                        custrecord_sr_pc_time_off_record: result.getValue({ name: "custrecord_sr_pc_time_off_record"}),
                        custrecord_sr_pc_time_off_employee: result.getValue({ name: "custrecord_sr_pc_time_off_employee"}),
                        custrecord_timeofftype_paycode: result.getValue({ name: "custrecord_timeofftype_paycode"}),
                        custrecord_timeofftype: result.getText({ name: "custrecord_timeofftype"}),
                        custrecord_startdate: result.getValue({ name: "custrecord_startdate"}),
                        custrecord_enddate: result.getValue({ name: "custrecord_enddate"}),
                        custrecord_sr_pc_amount_of_time: result.getValue({ name: "custrecord_sr_pc_amount_of_time"})
                    });
                    return true;
                });
            }

            return arrTimeOffRequestsAssociation;
        }

        fn.getForReversalTimeOffRequestsAssociation = function(arrTimeOffTypes, arrEmployeeList) {
            var arrTimeOffRequests = [];
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["isinactive","is","F"], "AND",
                    ["custrecord_sr_pc_for_reversal","is",true], "AND",
                    ["custrecord_sr_pc_is_cancelled","is",true], "AND",
                    ["custrecord_sr_pc_time_off_header","anyof","@NONE@"], "AND",
                    ["custrecord_timeofftype","anyof", arrTimeOffTypes], "AND",
                    ["custrecord_sr_pc_time_off_employee","anyof",arrEmployeeList]
                ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_record"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_employee"}),
                    search.createColumn({ name: "custrecord_timeofftype_paycode"}),
                    search.createColumn({ name: "custrecord_timeofftype"}),
                    search.createColumn({ name: "custrecord_startdate"}),
                    search.createColumn({ name: "custrecord_enddate"}),
                    search.createColumn({ name: "custrecord_sr_pc_amount_of_time"})
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){
                    // if(result.getValue({ name: "custrecord_sr_pc_time_off_record"}) != '') {
                    //     var isExist = arrTimeOffRequests.some(function(value){ return value == result.getValue({ name: "custrecord_sr_pc_time_off_record"}); });
                    //
                    //     if(!isExist) {
                    arrTimeOffRequests.push(result.getValue({ name: "custrecord_sr_pc_time_off_record"}));
                    // }
                    // }

                    return true;
                });
            }

            // log.debug('arrTimeOffRequests', arrTimeOffRequests);
            if(arrTimeOffRequests.length != 0) {
                return fn.getForReversalTimeOffRequestsAssociationDetails(arrTimeOffRequests);
            } else { return arrTimeOffRequests; }

        }

        fn.getForReversalTimeOffRequestsAssociationDetails = function(arrTimeOffRequests) {
            var arrTimeOffRequestsAssociation = [];
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["isinactive","is","F"], "AND",
                    ["custrecord_sr_pc_for_reversal","is",true], "AND",
                    ["custrecord_sr_pc_is_cancelled","is",true], "AND",
                    ["custrecord_sr_pc_time_off_record","anyof",arrTimeOffRequests]
                ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_record"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_employee"}),
                    search.createColumn({ name: "custrecord_timeofftype_paycode"}),
                    search.createColumn({ name: "custrecord_timeofftype"}),
                    search.createColumn({ name: "custrecord_startdate"}),
                    search.createColumn({ name: "custrecord_enddate"}),
                    search.createColumn({ name: "custrecord_sr_pc_amount_of_time"})
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){
                    arrTimeOffRequestsAssociation.push({
                        recordid: result.id,
                        custrecord_sr_pc_time_off_record: result.getValue({ name: "custrecord_sr_pc_time_off_record"}),
                        custrecord_sr_pc_time_off_employee: result.getValue({ name: "custrecord_sr_pc_time_off_employee"}),
                        custrecord_timeofftype_paycode: result.getValue({ name: "custrecord_timeofftype_paycode"}),
                        custrecord_timeofftype: result.getValue({ name: "custrecord_timeofftype"}),
                        custrecord_timeofftype_name: result.getText({ name: "custrecord_timeofftype"}),
                        custrecord_startdate: result.getValue({ name: "custrecord_startdate"}),
                        custrecord_enddate: result.getValue({ name: "custrecord_enddate"}),
                        custrecord_sr_pc_amount_of_time: result.getValue({ name: "custrecord_sr_pc_amount_of_time"})
                    });
                    return true;
                });
            }

            return arrTimeOffRequestsAssociation;
        }

        fn.getTimeOffRequestsAssociationLists = function(arrTimeOffTypes, arrEmployeeList, dtStartDate, dtEndDate) {
            var arrTimeOffRequests = [];
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["isinactive","is","F"], "AND",
                    ["custrecord_sr_pc_time_off_record.approvalstatus","anyof","8"], "AND",
                    ["custrecord_sr_pc_is_cancelled","is", "F"], "AND",
                    ["custrecord_sr_pc_time_off_header","anyof","@NONE@"], "AND",
                    ["custrecord_timeofftype","anyof", arrTimeOffTypes], "AND",
                    ["custrecord_sr_pc_time_off_employee","anyof",arrEmployeeList], "AND",
                    ["custrecord_startdate","onorafter",[format.format({ value: dtStartDate, type: format.Type.DATE })]], "AND",
                    ["custrecord_enddate","onorbefore",[format.format({ value: dtEndDate, type: format.Type.DATE })]]
                ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_record"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_employee"}),
                    search.createColumn({ name: "custrecord_timeofftype_paycode"}),
                    search.createColumn({ name: "custrecord_timeofftype"}),
                    search.createColumn({ name: "custrecord_startdate"}),
                    search.createColumn({ name: "custrecord_enddate"}),
                    search.createColumn({ name: "custrecord_sr_pc_amount_of_time"}),
                    search.createColumn({ name: "custrecord_sr_pc_is_cancelled"})
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){
                    // if(result.getValue({ name: "custrecord_sr_pc_time_off_record"}) != '') {
                    //     var isExist = arrTimeOffRequests.some(function(value){ return value == result.getValue({ name: "custrecord_sr_pc_time_off_record"}); });
                    //     if(!isExist) {
                    if(result.getValue('custrecord_sr_pc_is_cancelled') == false) {
                        arrTimeOffRequests.push(result.getValue({ name: "custrecord_sr_pc_time_off_record"}));
                    }

                    // }
                    // }

                    return true;
                });
            }

            // log.debug('arrTimeOffRequests', arrTimeOffRequests);
            if(arrTimeOffRequests.length != 0) {
                return fn.getTimeOffRequestsAssociationDetails(arrTimeOffRequests, dtStartDate, dtEndDate);
            } else { return arrTimeOffRequests; }

        }

        fn.getTimeOffRequestsAssociationDetails = function(arrTimeOffRequests, dtStartDate, dtEndDate) {
            var arrTimeOffRequestsAssociation = [];
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["isinactive","is","F"], "AND",
                    ["custrecord_sr_pc_is_cancelled","is", "F"], "AND",
                    ["custrecord_sr_pc_time_off_record","anyof",arrTimeOffRequests], "AND",
                    ["custrecord_startdate","onorafter",[format.format({ value: dtStartDate, type: format.Type.DATE })]], "AND",
                    ["custrecord_enddate","onorbefore",[format.format({ value: dtEndDate, type: format.Type.DATE })]]
                ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_record"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_employee"}),
                    search.createColumn({ name: "custrecord_timeofftype_paycode"}),
                    search.createColumn({ name: "custrecord_timeofftype"}),
                    search.createColumn({ name: "custrecord_startdate"}),
                    search.createColumn({ name: "custrecord_enddate"}),
                    search.createColumn({ name: "custrecord_sr_pc_amount_of_time"}),
                    search.createColumn({ name: "custrecord_sr_pc_is_cancelled"})
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){

                    if(result.getValue('custrecord_sr_pc_is_cancelled') == false) {
                        arrTimeOffRequestsAssociation.push({
                            recordid: result.id,
                            custrecord_sr_pc_time_off_record: result.getValue({ name: "custrecord_sr_pc_time_off_record"}),
                            custrecord_sr_pc_time_off_employee: result.getValue({ name: "custrecord_sr_pc_time_off_employee"}),
                            custrecord_timeofftype_paycode: result.getValue({ name: "custrecord_timeofftype_paycode"}),
                            custrecord_timeofftype: result.getValue({ name: "custrecord_timeofftype"}),
                            custrecord_timeofftype_name: result.getText({ name: "custrecord_timeofftype"}),
                            custrecord_startdate: result.getValue({ name: "custrecord_startdate"}),
                            custrecord_enddate: result.getValue({ name: "custrecord_enddate"}),
                            custrecord_sr_pc_amount_of_time: result.getValue({ name: "custrecord_sr_pc_amount_of_time"})
                        });
                    }

                    return true;
                });
            }

            return arrTimeOffRequestsAssociation;
        }

        fn.findApprovedTimeOffRequests = function(arrTimeOffTypes, intPayrollProvider, dtStartDate, dtEndDate) {
            var arrTimeOffRequests = [];
            var timeoffrequestSearchObj = search.create({
                type: "timeoffrequest",
                filters: [
                    ["timeoffrequestdetail.timeofftype","anyof",arrTimeOffTypes], "AND",
                    ["employee.custentity_payroll_provider","is", intPayrollProvider], "AND",
                    ["employee.isinactive","is","F"], "AND",
                    ["approvalstatus","anyof","8"], "AND",
                    ["startdate","onorafter",[format.format({ value: dtStartDate, type: format.Type.DATE })]], "AND",
                    ["enddate","onorbefore",[format.format({ value: dtEndDate, type: format.Type.DATE })]]
                ],
                columns: [
                    search.createColumn({ name: "internalid", summary: "GROUP" }),
                    search.createColumn({ name: "startdate", summary: "GROUP" }),
                    search.createColumn({ name: "enddate", summary: "GROUP" }),
                    search.createColumn({ name: "employee", summary: "GROUP" }),
                    search.createColumn({ name: "timeofftype", summary: "GROUP" }),
                    search.createColumn({ name: "amountoftime", join: "timeOffRequestDetail", summary: "SUM" })
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){
                    arrTimeOffRequests.push({
                        recordid: result.getValue({ name: "internalid", summary: "GROUP" }),
                        employee: result.getValue({ name: "employee", summary: "GROUP" }),
                        timeofftype: result.getValue({ name: "timeofftype", summary: "GROUP" }),
                        startdate: result.getValue({ name: "startdate", summary: "GROUP" }),
                        enddate: result.getValue({ name: "enddate", summary: "GROUP" }),
                        amountoftime: result.getValue({ name: "amountoftime", join: "timeOffRequestDetail", summary: "SUM" })
                    });
                    return true;
                });
            }

            return arrTimeOffRequests;
        }

        fn.getApprovedTimeOffRequestsDetails = function(arrTimeOffTypes, intPayrollProvider, dtStartDate, dtEndDate) {
            var arrTimeOffRequests = [];
            var timeoffrequestSearchObj = search.create({
                type: "timeoffrequest",
                filters: [
                    ["timeoffrequestdetail.timeofftype","anyof",arrTimeOffTypes], "AND",
                    ["employee.custentity_payroll_provider","is", intPayrollProvider], "AND",
                    ["employee.isinactive","is","F"], "AND",
                    ["approvalstatus","anyof","8"], "AND",
                    ["startdate","onorafter",[format.format({ value: dtStartDate, type: format.Type.DATE })]], "AND",
                    ["enddate","onorbefore",[format.format({ value: dtEndDate, type: format.Type.DATE })]]
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
                    var timeunit = result.getValue({ name: "timeunit",join: "timeOffRequestDetail" });
                    var amountoftime = (timeunit == 'DAYS') ? parseFloat(parseFloat(result.getValue({ name: "amountoftime", join: "timeOffRequestDetail"})) * 8) : result.getValue({ name: "amountoftime", join: "timeOffRequestDetail"});

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
                    return true;
                });
            }

            return arrTimeOffRequests;
        }

        fn.getTimeOffTypes = function() {
            var objTimeOffTypes = {};
            var timeofftypeSearchObj = search.create({
                type: "timeofftype",
                // filters: [["custrecord_sr_epayroll_code","isnotempty",""]],
                filters: [],
                columns: [
                    search.createColumn({name: "custrecord_sr_epayroll_code"}),
                    search.createColumn({name: "name"}),
                    search.createColumn({name: "displayname"}),
                ]
            });

            var searchResultCount = timeofftypeSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeofftypeSearchObj.run().each(function(result){
                    if(objTimeOffTypes[result.getValue('name')] == null) {
                        objTimeOffTypes[result.getValue('name')] = {
                            custrecord_sr_epayroll_code: result.getValue('custrecord_sr_epayroll_code'),
                            recordid: result.id,
                            name: result.getValue('name'),
                            displayname: result.getValue('displayname'),
                        };
                    }

                    return true;
                });
            }
            return objTimeOffTypes;
        }

        fn.generateCSV = function(objEmployeePayroll, intPayrollProvider, stStartDate, stEndDate) {
            var objEmployees = {};
            var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: intPayrollProvider, isDynamic: true });
            var objEmployees = fn.getPayrollData(objEmployeePayroll, intPayrollProvider, stStartDate, stEndDate);

            // for(var intIndex in objEmployees) { }

            // var dtStartDate = fn.getFormattedDate(stStartDate);
            // var dtEndDate = fn.getFormattedDate(stEndDate);
            var dtStartDate = format.parse({ value: stStartDate, type: format.Type.DATE });
            var dtEndDate = format.parse({ value: stEndDate, type: format.Type.DATE });
            var arrRows = [];

            var stFileName = 'payroll-'+dtStartDate.getDate()+'-'+dtEndDate.getDate()+'-'+(dtEndDate.getMonth()+1)+'-'+dtEndDate.getFullYear()+'.csv';

            for(var i in objEmployees) {
                for(var j in objEmployees[i].data) {
                    var arrColumns = [];
                    delete objEmployees[i].data[j]["isparent_row"];

                    if(!recPayrollProvider.getValue('custrecord_sr_is_excluded_er_download')) {
                        delete objEmployees[i].data[j]["isparent_row"];
                    }

                    for(var intDataIndex in objEmployees[i].data[j]) {
                        arrColumns.push(objEmployees[i].data[j][intDataIndex]);
                    }
                    arrRows.push(arrColumns.join(',')+'\r');
                }
            }

            // var fileId = fn.createCSV(stFileName);

            // fn.updateCSV(fileId, arrRows);
            var fileId = fn.createCSVFile(stFileName, arrRows, intPayrollProvider);
            return fileId;
        }

        fn.getPayrollData = function(objEmployeePayroll, intPayrollProvider, stStartDate, stEndDate) {
            // try {
            //     var objTimeOffTypes = fn.getTimeOffTypes();
            var dtStartDate = format.parse({ value: stStartDate, type: format.Type.DATE });
            var dtEndDate = format.parse({ value: stEndDate, type: format.Type.DATE });
            var objEmployees = {};
            var arrEmployeeListPayroll = [];

            var recPayrollProvider = record.load({type: "customrecord_payroll_provider", id: intPayrollProvider, isDynamic: true });
            var objCostCenterOverride = {};
            var objPayCodes = {};

            if(recPayrollProvider.getValue('custrecord_sr_cost_center_override') != '') { objCostCenterOverride = JSON.parse(recPayrollProvider.getValue('custrecord_sr_cost_center_override')); }
            if(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id') != '') { objPayCodes = JSON.parse(recPayrollProvider.getValue('custrecord_sr_pp_paycode_id')); }

            /** Employee Payroll Calculation **/
            for(var intIndex in objEmployeePayroll) {
                var intEmpId = objEmployeePayroll[intIndex].id;
                var flTotalWorkingHours = parseFloat(objEmployeePayroll[intIndex].total_working_hours).toFixed(2);
                var stStandardHours = objEmployeePayroll[intIndex].standard_hour;
                // var flQuantity = (stStandardHours == " " || stStandardHours == "") ? flTotalWorkingHours : stStandardHours;
                var flQuantity = flTotalWorkingHours;
                var stCostCenter = objEmployeePayroll[intIndex].cost_center.trim();
                if(objEmployees[intEmpId] == null) { objEmployees[intEmpId] = { data:[] }; }
                arrEmployeeListPayroll.push(intEmpId);

                objEmployees[intEmpId].data.push({
                    code: objEmployeePayroll[intIndex].code,
                    isparent_row: true,
                    cost_center: (typeof objCostCenterOverride[stCostCenter] !='undefined') ? objCostCenterOverride[stCostCenter] : stCostCenter,
                    paycode_id: recPayrollProvider.getValue('custrecord_sr_pp_ordinary_paycodeid'),
                    total_working_hours: flQuantity,
                    payroll_start: fn.padnumber('00',dtStartDate.getDate())+fn.padnumber('00',parseInt(dtStartDate.getMonth()+1))+dtStartDate.getFullYear(),
                    payroll_end: fn.padnumber('00',dtEndDate.getDate())+fn.padnumber('00',parseInt(dtEndDate.getMonth()+1))+dtEndDate.getFullYear(),
                    leave_start: "",
                    leave_end: "",
                    number_pays: objEmployeePayroll[intIndex].number_pays,
                    alter_rate: 0,
                });
            }

            var arrTimeOffTypes = recPayrollProvider.getText('custrecord_timeoff_types');
            // log.debug('arrTimeOffTypes', arrTimeOffTypes);

            if(arrTimeOffTypes != '') {
                // var arrTimeOffRequests = fn.getApprovedTimeOffRequestsDetails(arrTimeOffTypes, intPayrollProvider, stStartDate, stEndDate);
                // var arrTimeOffRequestsAssociation = fn.getTimeOffRequestsAssociation(arrEmployeeListPayroll, stStartDate, stEndDate);
                var arrTimeOffRequestsAssociation = fn.getTimeOffRequestsAssociationLists(recPayrollProvider.getValue('custrecord_timeoff_types'), arrEmployeeListPayroll, stStartDate,stEndDate);

                // for(var intIndex in arrTimeOffRequests) {
                for(var intIndex in arrTimeOffRequestsAssociation) {
                    // if(arrTimeOffRequestsAssociation[intIndexAssociation].custrecord_sr_pc_time_off_record == arrTimeOffRequests[intIndex].recordid) {
                    var dtLeaveStartDate = fn.getFormattedDate(arrTimeOffRequestsAssociation[intIndex].custrecord_startdate);
                    var dtLeaveEndDate = fn.getFormattedDate(arrTimeOffRequestsAssociation[intIndex].custrecord_enddate);

                    if(objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee] == null) {
                        objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee] = { data:[] };
                    }

                    var stCode = (typeof objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0] == 'undefined') ? "" : objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].code;
                    var stCostCenter = (typeof objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0] == 'undefined') ? "" : objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].cost_center;

                    var stPayCode = "";
                    var stQuantity = "";
                    // (intPayrollProvider == 1) ? objPayCodes[arrTimeOffRequests[intIndex].timeofftype] : arrTimeOffRequests[intIndex].timeofftype;

                    if(fn.existInArrTimeOffTypes(arrTimeOffTypes, arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name)) {
                        if(intPayrollProvider == 1) {
                            if(typeof objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else { stPayCode = ""; }
                        } else {
                            if(typeof objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objPayCodes[arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else {
                                if(arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name != "") {
                                    stPayCode = arrTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name;
                                } else { stPayCode = "Other Unpaid Leave"; }
                            }
                        }
                    } else { stPayCode = "Other Unpaid Leave"; }

                    if(typeof objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0] != "undefined") {
                        objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].total_working_hours = parseFloat(objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].total_working_hours) - parseFloat(arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_amount_of_time);
                    }

                    objEmployees[arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data.push({
                        code: stCode,
                        cost_center: stCostCenter,
                        paycode_id: stPayCode,
                        timeoffrequestassociationid: arrTimeOffRequestsAssociation[intIndex].recordid,
                        total_working_hours: parseFloat(arrTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_amount_of_time).toFixed(2),
                        payroll_start: fn.padnumber('00',dtStartDate.getDate())+fn.padnumber('00',parseInt(dtStartDate.getMonth()+1))+dtStartDate.getFullYear(),
                        payroll_end: fn.padnumber('00',dtEndDate.getDate())+fn.padnumber('00',parseInt(dtEndDate.getMonth()+1))+dtEndDate.getFullYear(),
                        leave_start: fn.padnumber('00',dtLeaveStartDate.getDate())+fn.padnumber('00',parseInt(dtLeaveStartDate.getMonth()+1))+dtLeaveStartDate.getFullYear(),
                        leave_end: fn.padnumber('00',dtLeaveEndDate.getDate())+fn.padnumber('00',parseInt(dtLeaveEndDate.getMonth()+1))+dtLeaveEndDate.getFullYear(),
                        number_pays: '1.00',
                        alter_rate: 0,
                    });
                    // }
                }
                // }

                /** PROCESS REVERSAL OF CANCELLED TIME-OFF REQUESTS **/
                var arrReversalTimeOffRequestsAssociation = fn.getForReversalTimeOffRequestsAssociation(recPayrollProvider.getValue('custrecord_timeoff_types'), arrEmployeeListPayroll);

                for(var intIndex in arrReversalTimeOffRequestsAssociation) {
                    // if(arrTimeOffRequestsAssociation[intIndexAssociation].custrecord_sr_pc_time_off_record == arrTimeOffRequests[intIndex].recordid) {
                    var dtLeaveStartDate = fn.getFormattedDate(arrReversalTimeOffRequestsAssociation[intIndex].custrecord_startdate);
                    var dtLeaveEndDate = fn.getFormattedDate(arrReversalTimeOffRequestsAssociation[intIndex].custrecord_enddate);

                    if(objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee] == null) {
                        objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee] = { data:[] };
                    }

                    var stCode = (typeof objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0] == 'undefined') ? "" : objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].code;
                    var stCostCenter = (typeof objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0] == 'undefined') ? "" : objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].cost_center;

                    var stPayCode = "";
                    var stQuantity = "";
                    // (intPayrollProvider == 1) ? objPayCodes[arrTimeOffRequests[intIndex].timeofftype] : arrTimeOffRequests[intIndex].timeofftype;

                    if(fn.existInArrTimeOffTypes(arrTimeOffTypes, arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name)) {
                        if(intPayrollProvider == 1) {
                            if(typeof objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else { stPayCode = ""; }
                        } else {
                            if(typeof objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name] != 'undefined') {
                                stPayCode = objPayCodes[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name];
                            } else { stPayCode = arrReversalTimeOffRequestsAssociation[intIndex].custrecord_timeofftype_name; }
                        }
                    } else { stPayCode = "Other Unpaid Leave"; }

                    if(typeof objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0] != "undefined") {
                        objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].total_working_hours = parseFloat(objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data[0].total_working_hours) - parseFloat(arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_amount_of_time);
                    }

                    objEmployees[arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_time_off_employee].data.push({
                        code: stCode,
                        cost_center: stCostCenter,
                        paycode_id: stPayCode,
                        timeoffrequestassociationid: arrReversalTimeOffRequestsAssociation[intIndex].recordid,
                        total_working_hours: parseFloat(arrReversalTimeOffRequestsAssociation[intIndex].custrecord_sr_pc_amount_of_time).toFixed(2),
                        payroll_start: fn.padnumber('00',dtStartDate.getDate())+fn.padnumber('00',parseInt(dtStartDate.getMonth()+1))+dtStartDate.getFullYear(),
                        payroll_end: fn.padnumber('00',dtEndDate.getDate())+fn.padnumber('00',parseInt(dtEndDate.getMonth()+1))+dtEndDate.getFullYear(),
                        leave_start: fn.padnumber('00',dtLeaveStartDate.getDate())+fn.padnumber('00',parseInt(dtLeaveStartDate.getMonth()+1))+dtLeaveStartDate.getFullYear(),
                        leave_end: fn.padnumber('00',dtLeaveEndDate.getDate())+fn.padnumber('00',parseInt(dtLeaveEndDate.getMonth()+1))+dtLeaveEndDate.getFullYear(),
                        number_pays: '1.00',
                        alter_rate: 0,
                    });
                    // }
                }
            }

            return objEmployees;
            // } catch(e) { log.debug('ERROR', e); }
        }

        fn.setPayCycleForTimeOffRequest = function(intFileId, intPayCycleId, arrTimeOffRequests) {
            /** Attach CSV File in the Pay Cycle Record **/
            record.submitFields({
                type: "customrecord_sr_pay_cycle",
                id: intPayCycleId,
                values: { custrecord_sr_pc_csv_file: intFileId }
            });

            /** Link Pay Cycle Record to Time-Off-Request Records **/
            if(arrTimeOffRequests.length != 0) {
                for(var intIndex in arrTimeOffRequests) {
                    // log.debug('arrTimeOffRequests', arrTimeOffRequests[intIndex]);

                    // record.submitFields({
                    //     type: "timeoffrequest",
                    //     id: arrTimeOffRequests[intIndex].recordid,
                    //     values: { custrecord_sr_pc_pay_cycle: intPayCycleId }
                    // });
                }
            }
        }

        fn.createCSVFile = function(stName, arrRows, intPayrollProvider) {

            var stHeader = "";
            if(intPayrollProvider != 1) {
                stHeader = fn.csvHeader.join(',') + '\n';
            }

            var fileObj = file.create({
                name: stName,
                fileType: file.Type.CSV,
                contents: stHeader
            });

            // if(runtime.envType == 'SANDBOX') {
            //     fileObj.folder = 7191; // SANDBOX
            // } else {
            fileObj.folder = 6295; // PRODUCTION
            // }

            for (var i in arrRows) { fileObj.appendLine({ value: arrRows[i] }); }
            return fileObj.save();
        }

        fn.createCSV = function(stName) {

            var fileObj = file.create({
                name: stName,
                fileType: file.Type.CSV,
                contents: fn.csvHeader.join(',') + '\n'
            });
            fileObj.folder = 6295;

            return fileObj.save();
        }

        fn.updateCSV = function(fileId, arrRows) {
            var filedata = file.load({
                id: fileId
            });

            for (var i in arrRows) {
                filedata.appendLine({
                    value: arrRows[i]
                });
            }
            filedata.save();

        }

        fn.padnumber = function(pad, number) {
            return (pad+number).slice(-pad.length);
        }

        fn.getCurrencies = function() {
            var objData = {};
            var searchObj = search.create({
                type: "currency",
                filters:  ["isinactive","is","F"],
                columns: [
                    search.createColumn({name: "exchangerate"}),
                    search.createColumn({name: "name"}),
                    search.createColumn({name: "symbol"}),
                ]
            });
            var searchResultCount = searchObj.runPaged().count;
            if(searchResultCount != 0) {
                searchObj.run().each(function(result) {
                    if(objData[result.getValue('name')] == null) { objData[result.getValue('name')] = {}; }
                    objData[result.getValue('name')] = {
                        "recordid": result.id,
                        "name": result.getValue('name'),
                        "exchangerate": result.getValue('exchangerate'),
                        "symbol": result.getValue('symbol'),
                    };
                    return true;
                });
            }

            return objData;
        }

        fn.getUSDCurrencyRate = function(stRecordType, stForeignSymbolCurrency, objCurrencies,dtStartDate, dtEndDate) {
            var CURRENCY_USD_NAME = "US Dollar";
            var flRate = 0;
            var stForeignCurrencyName = "";
            if(stRecordType == 'bonus') {
                for(var intIndex in objCurrencies) {
                    if(objCurrencies[intIndex].symbol == stForeignSymbolCurrency) { stForeignCurrencyName = intIndex; }
                }
            } else if(stRecordType == 'allowance') { stForeignCurrencyName = stForeignSymbolCurrency; }

            var consolidatedexchangerateSearchObj = search.create({
                type: "consolidatedexchangerate",
                filters:  ["periodstartdate","within",dtStartDate,dtEndDate],
                columns: [
                    search.createColumn({name: "fromcurrency", label: "From Currency"}),
                    search.createColumn({name: "tocurrency", label: "To Currency"}),
                    search.createColumn({name: "currentrate", label: "Current"}),
                    search.createColumn({name: "periodstartdate", label: "Period Start Date"})
                ]
            });
            var searchResultCount = consolidatedexchangerateSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                consolidatedexchangerateSearchObj.run().each(function(result){
                    if(result.getValue('fromcurrency') == stForeignCurrencyName && result.getValue('tocurrency') == CURRENCY_USD_NAME) {
                        flRate = parseFloat(result.getValue('currentrate'));
                    }
                    return true;
                });
            }
            return flRate;
        }

        fn.getEmployeeBonuses = function(arrEmployeeIds, stStartDate, stEndDate) {
            var arrEmployeeBonuses = [];
            var filters = [
                ["bonusemployee", "anyof", arrEmployeeIds],"AND",
                ["bonusawarddate","onorbefore", stEndDate]
            ];
            var columns = [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "bonusemployee"}),
                search.createColumn({name: "bonusawarddate"}),
                search.createColumn({name: "bonusamountpercentage"}),
                search.createColumn({name: "bonusamountabsolute"}),
                search.createColumn({name: "bonuscomment"}),
                search.createColumn({name: "bonustype"}),
                search.createColumn({name: "bonuscurrency"}),
                search.createColumn({name: "bonusstatus"})
            ];

            var bonusSearchObj = fn.runSearch("bonus",  null, filters, columns);
            if(bonusSearchObj.length != 0) {
                for(var intIndex=0; intIndex<bonusSearchObj.length; intIndex++) {
                    arrEmployeeBonuses.push({
                        recordtype: "bonus",
                        bonusid: bonusSearchObj[intIndex].getValue('internalid'),
                        bonusemployee : bonusSearchObj[intIndex].getValue('bonusemployee'),
                        bonusawarddate : bonusSearchObj[intIndex].getValue('bonusawarddate'),
                        bonusamountpercentage : bonusSearchObj[intIndex].getValue('bonusamountpercentage'),
                        bonusamountabsolute : bonusSearchObj[intIndex].getValue('bonusamountabsolute'),
                        bonuscomment : bonusSearchObj[intIndex].getValue('bonuscomment'),
                        bonustype : bonusSearchObj[intIndex].getText('bonustype'),
                        bonustypeid : bonusSearchObj[intIndex].getValue('bonustype'),
                        bonuscurrency : bonusSearchObj[intIndex].getValue('bonuscurrency'),
                        bonuscurrencytext : bonusSearchObj[intIndex].getText('bonuscurrency'),
                        bonusstatus : bonusSearchObj[intIndex].getValue('bonusstatus')
                    });
                }
            }

            return arrEmployeeBonuses;
        }

        fn.getEmployeeAllowances = function(arrEmployeeIds, dtStartDate, dtEndDate) {
            var arrEmployeeAllowances = [];
            var filters = [
                ["isinactive", "is", "F"],"AND",
                ["custrecord_sr_pc_allowance_employee", "anyof", arrEmployeeIds],"AND",
                [["custrecord_sr_pc_allowance_end_date","isempty",""], "OR",
                    ["custrecord_sr_pc_allowance_end_date","onorafter", dtStartDate]],"AND",
                ["custrecord_sr_pc_allowance_start_date","onorbefore",dtEndDate]
            ];
            var columns = [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "custrecord_sr_pc_allowance_employee"}),
                search.createColumn({name: "custrecord_pc_allowance_type"}),
                search.createColumn({name: "custrecord_sr_pc_allowance_start_date"}),
                search.createColumn({name: "custrecord_sr_pc_allowance_end_date"}),
                search.createColumn({name: "custrecord_sr_pc_allowance_amount"}),
                search.createColumn({name: "custrecord_sr_pc_allowance_memo"}),
                search.createColumn({name: "custrecord_sr_allowance_currency"})
            ];

            var allowanceSearchObj = fn.runSearch("customrecord_sr_pay_cycle_allowance",  null, filters, columns);
            if(allowanceSearchObj.length != 0) {
                for(var intIndex=0; intIndex<allowanceSearchObj.length; intIndex++) {
                    arrEmployeeAllowances.push({
                        allowanceid: allowanceSearchObj[intIndex].getValue('internalid'),
                        allowanceemployee : allowanceSearchObj[intIndex].getValue('custrecord_sr_pc_allowance_employee'),
                        allowanceemployeetext : allowanceSearchObj[intIndex].getText('custrecord_sr_pc_allowance_employee'),
                        allowancetype : allowanceSearchObj[intIndex].getValue('custrecord_pc_allowance_type'),
                        allowancetypetext : allowanceSearchObj[intIndex].getText('custrecord_pc_allowance_type'),
                        allowancestartdate : allowanceSearchObj[intIndex].getValue('custrecord_sr_pc_allowance_start_date'),
                        allowanceenddate : allowanceSearchObj[intIndex].getValue('custrecord_sr_pc_allowance_end_date'),
                        allowanceamount : allowanceSearchObj[intIndex].getValue('custrecord_sr_pc_allowance_amount'),
                        allowancememo : allowanceSearchObj[intIndex].getText('custrecord_sr_pc_allowance_memo'),
                        allowancecurrency : allowanceSearchObj[intIndex].getText('custrecord_sr_allowance_currency')
                    });
                }
            }
            return arrEmployeeAllowances;
        }

        fn.getEmployeeExpenseReports = function(arrEmployeeIds, dtStartDate, dtEndDate) {
            var arrData = [];
            var filters = [
                ["status","anyof",["ExpRept:F","ExpRept:G","ExpRept:I"]], "AND",
                ["mainline","is","T"], "AND",
                ["trandate","onorbefore", dtEndDate], "AND",
                ["name","anyof",arrEmployeeIds]
            ];
            var columns = [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "trandate"}),
                search.createColumn({name: "tranid"}),
                search.createColumn({name: "entity"}),
                search.createColumn({name: "subsidiary"}),
                search.createColumn({name: "account"}),
                search.createColumn({name: "memo"}),
                search.createColumn({name: "currency"}),
                search.createColumn({name: "amount"}),
                search.createColumn({name: "fxamount"}),
                search.createColumn({name: "status"})
            ];

            var expensereportSearchObj = fn.runSearch("expensereport",  null, filters, columns);
            if(expensereportSearchObj.length != 0) {
                for(var intIndex=0; intIndex<expensereportSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: expensereportSearchObj[intIndex].getValue('internalid'),
                        recordtype: "expensereport",
                        trandate: expensereportSearchObj[intIndex].getValue('trandate'),
                        subsidiary: expensereportSearchObj[intIndex].getValue('subsidiary'),
                        memo: expensereportSearchObj[intIndex].getValue('memo'),
                        currency: expensereportSearchObj[intIndex].getValue('currency'),
                        tranid: "Expense Report #"+expensereportSearchObj[intIndex].getValue('tranid'),
                        entityid: expensereportSearchObj[intIndex].getValue('entity'),
                        entityname: expensereportSearchObj[intIndex].getText('entity'),
                        accountid: expensereportSearchObj[intIndex].getValue('account'),
                        accountname: expensereportSearchObj[intIndex].getText('account'),
                        amount: expensereportSearchObj[intIndex].getValue('amount'),
                        fxamount: expensereportSearchObj[intIndex].getValue('fxamount'),
                        status: expensereportSearchObj[intIndex].getValue('status'),
                        statustext: expensereportSearchObj[intIndex].getText('status')
                    });
                }
            }

            return arrData;

        }

        fn.getEmployeeExpenseReportDetails = function(arrEmployeeIds, dtStartDate, dtEndDate) {
            var arrData = [];
            var filters = [
                ["status","anyof",["ExpRept:F","ExpRept:G","ExpRept:I"]], "AND",
                ["mainline","is","F"], "AND",
                ["trandate","onorbefore", dtEndDate], "AND",
                ["name","anyof",arrEmployeeIds]
            ];
            var columns = [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "trandate"}),
                search.createColumn({name: "tranid"}),
                search.createColumn({name: "entity"}),
                search.createColumn({name: "internalid", join: "employee"}),
                search.createColumn({name: "subsidiary"}),
                search.createColumn({name: "account"}),
                search.createColumn({name: "expensecategory"}),
                search.createColumn({name: "memo"}),
                search.createColumn({name: "currency"}),
                search.createColumn({name: "amount"}),
                search.createColumn({name: "fxamount"}),
                search.createColumn({name: "status"})
            ];

            var expensereportSearchObj = fn.runSearch("expensereport",  null, filters, columns);
            if(expensereportSearchObj.length != 0) {
                for(var intIndex=0; intIndex<expensereportSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: expensereportSearchObj[intIndex].getValue('internalid'),
                        recordtype: "expensereport",
                        trandate: expensereportSearchObj[intIndex].getValue('trandate'),
                        subsidiary: expensereportSearchObj[intIndex].getValue('subsidiary'),
                        memo: expensereportSearchObj[intIndex].getValue('memo'),
                        currency: expensereportSearchObj[intIndex].getValue('currency'),
                        tranid: "Expense Report #"+expensereportSearchObj[intIndex].getValue('tranid'),
                        entityid: expensereportSearchObj[intIndex].getValue({name: "internalid", join: "employee"}),
                        entityname: expensereportSearchObj[intIndex].getText({name: "internalid", join: "employee"}),
                        expensecategoryid: expensereportSearchObj[intIndex].getValue('expensecategory'),
                        expensecategoryname: expensereportSearchObj[intIndex].getText('expensecategory'),
                        accountid: expensereportSearchObj[intIndex].getValue('account'),
                        accountname: expensereportSearchObj[intIndex].getText('account'),
                        amount: expensereportSearchObj[intIndex].getValue('amount'),
                        fxamount: expensereportSearchObj[intIndex].getValue('fxamount'),
                        status: expensereportSearchObj[intIndex].getValue('status'),
                        statustext: expensereportSearchObj[intIndex].getText('status')
                    });
                }
            }

            return arrData;

        }

        fn.getEmployeeBonusDetailsByPayCycle = function(intPayCycleId) {
            var arrEmployeeBonuses = [];
            var arrBonusAssociationIds = [];
            var arrBonusAssociations = fn.getBonusAssociation(intPayCycleId);
            if(arrBonusAssociations.length !=0) {
                for(var intIndex in arrBonusAssociations) {
                    arrBonusAssociationIds.push(arrBonusAssociations[intIndex].bonusid);
                }
            }

            if(arrBonusAssociationIds.length != 0) {
                var filters = ["internalid", "anyof", arrBonusAssociationIds];
                var columns = [
                    search.createColumn({name: "internalid"}),
                    search.createColumn({name: "bonusemployee"}),
                    search.createColumn({name: "bonusawarddate"}),
                    search.createColumn({name: "bonusamountpercentage"}),
                    search.createColumn({name: "bonusamountabsolute"}),
                    search.createColumn({name: "bonuscomment"}),
                    search.createColumn({name: "bonustype"}),
                    search.createColumn({name: "bonuscurrency"}),
                    search.createColumn({name: "bonusstatus"})
                ];

                var bonusSearchObj = fn.runSearch("bonus",  null, filters, columns);
                if(bonusSearchObj.length != 0) {
                    for(var intIndex=0; intIndex<bonusSearchObj.length; intIndex++) {
                        arrEmployeeBonuses.push({
                            recordtype: "bonus",
                            bonusid: bonusSearchObj[intIndex].getValue('internalid'),
                            bonusemployee : bonusSearchObj[intIndex].getValue('bonusemployee'),
                            bonusawarddate : bonusSearchObj[intIndex].getValue('bonusawarddate'),
                            bonusamountpercentage : bonusSearchObj[intIndex].getValue('bonusamountpercentage'),
                            bonusamountabsolute : bonusSearchObj[intIndex].getValue('bonusamountabsolute'),
                            bonuscomment : bonusSearchObj[intIndex].getValue('bonuscomment'),
                            bonustype : bonusSearchObj[intIndex].getText('bonustype'),
                            bonustypeid : bonusSearchObj[intIndex].getValue('bonustype'),
                            bonuscurrency : bonusSearchObj[intIndex].getValue('bonuscurrency'),
                            bonuscurrencytext : bonusSearchObj[intIndex].getText('bonuscurrency'),
                            bonusstatus : bonusSearchObj[intIndex].getValue('bonusstatus')
                        });
                    }
                }
            }
            return arrEmployeeBonuses;
        }

        fn.getBonusAssociation = function(intPayCycleId) {
            var arrData = [];
            var filters = ["custrecord_sr_pc_pay_cycle","is", intPayCycleId];
            var columns = [
                search.createColumn({name: "custrecord_sr_pc_bonus_id"}),
                search.createColumn({name: "custrecord_sr_pc_pay_cycle"})
            ];

            var bonusAssociationSearchObj = fn.runSearch("customrecord_sr_pc_bonus_association",  null, filters, columns);
            if(bonusAssociationSearchObj.length != 0) {
                for(var intIndex=0; intIndex<bonusAssociationSearchObj.length; intIndex++) {
                    arrData.push({
                        bonusassociationid: bonusAssociationSearchObj[intIndex].id,
                        bonusid: bonusAssociationSearchObj[intIndex].getValue('custrecord_sr_pc_bonus_id'),
                        paycycleid: bonusAssociationSearchObj[intIndex].getValue('custrecord_sr_pc_pay_cycle')
                    });
                }
            }

            return arrData;

        }

        fn.getEmployeeExpenseReportDetailsPerPayCycle = function(intPayCycleId) {
            var arrData = [];
            var filters = [
                ["mainline","is","F"], "AND",
                ["custbody_sr_pay_cycle","is", intPayCycleId]
            ];
            var columns = [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "trandate"}),
                search.createColumn({name: "tranid"}),
                search.createColumn({name: "entity"}),
                search.createColumn({name: "subsidiary"}),
                search.createColumn({name: "account"}),
                search.createColumn({name: "expensecategory"}),
                search.createColumn({name: "memo"}),
                search.createColumn({name: "currency"}),
                search.createColumn({name: "amount"}),
                search.createColumn({name: "fxamount"}),
                search.createColumn({name: "status"}),
                search.createColumn({name: "location", join: "employee"})
            ];

            var expensereportSearchObj = fn.runSearch("expensereport",  null, filters, columns);
            if(expensereportSearchObj.length != 0) {
                for(var intIndex=0; intIndex<expensereportSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: expensereportSearchObj[intIndex].getValue('internalid'),
                        recordtype: "expensereport",
                        trandate: expensereportSearchObj[intIndex].getValue('trandate'),
                        expensecategory: expensereportSearchObj[intIndex].getText('expensecategory'),
                        subsidiary: expensereportSearchObj[intIndex].getValue('subsidiary'),
                        memo: expensereportSearchObj[intIndex].getValue('memo'),
                        currency: expensereportSearchObj[intIndex].getValue('currency'),
                        tranid: "Expense Report #"+expensereportSearchObj[intIndex].getValue('tranid'),
                        entityid: expensereportSearchObj[intIndex].getValue('entity'),
                        entityname: expensereportSearchObj[intIndex].getText('entity'),
                        accountid: expensereportSearchObj[intIndex].getValue('account'),
                        accountname: expensereportSearchObj[intIndex].getText('account'),
                        amount: expensereportSearchObj[intIndex].getValue('amount'),
                        fxamount: expensereportSearchObj[intIndex].getValue('fxamount'),
                        status: expensereportSearchObj[intIndex].getValue('status'),
                        statustext: expensereportSearchObj[intIndex].getText('status'),
                        location: expensereportSearchObj[intIndex].getText({name: "location", join: "employee"}).replace(" ", "_").toUpperCase()
                    });
                }
            }

            return arrData;

        }

        fn.getEmployeeExpenseReportsPerPayCycle = function(intPayCycleId) {
            var arrData = [];
            var filters = [
                ["mainline","is","T"], "AND",
                ["custbody_sr_pay_cycle","is", intPayCycleId]
            ];
            var columns = [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "trandate"}),
                search.createColumn({name: "tranid"}),
                search.createColumn({name: "entity"}),
                search.createColumn({name: "subsidiary"}),
                search.createColumn({name: "account"}),
                search.createColumn({name: "memo"}),
                search.createColumn({name: "currency"}),
                search.createColumn({name: "amount"}),
                search.createColumn({name: "fxamount"}),
                search.createColumn({name: "status"}),
                search.createColumn({name: "location", join: "employee"})
            ];

            var expensereportSearchObj = fn.runSearch("expensereport",  null, filters, columns);
            if(expensereportSearchObj.length != 0) {
                for(var intIndex=0; intIndex<expensereportSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: expensereportSearchObj[intIndex].getValue('internalid'),
                        recordtype: "expensereport",
                        trandate: expensereportSearchObj[intIndex].getValue('trandate'),
                        subsidiary: expensereportSearchObj[intIndex].getValue('subsidiary'),
                        memo: expensereportSearchObj[intIndex].getValue('memo'),
                        currency: expensereportSearchObj[intIndex].getValue('currency'),
                        tranid: "Expense Report #"+expensereportSearchObj[intIndex].getValue('tranid'),
                        entityid: expensereportSearchObj[intIndex].getValue('entity'),
                        entityname: expensereportSearchObj[intIndex].getText('entity'),
                        accountid: expensereportSearchObj[intIndex].getValue('account'),
                        accountname: expensereportSearchObj[intIndex].getText('account'),
                        amount: expensereportSearchObj[intIndex].getValue('amount'),
                        fxamount: expensereportSearchObj[intIndex].getValue('fxamount'),
                        status: expensereportSearchObj[intIndex].getValue('status'),
                        statustext: expensereportSearchObj[intIndex].getText('status'),
                        location: expensereportSearchObj[intIndex].getText({name: "location", join: "employee"}).replace(" ", "_").toUpperCase()
                    });
                }
            }

            return arrData;

        }

        fn.getTimeOffRequestsAssociationPerPayCycle = function(intPayCycleId) {
            var arrTimeOffRequestsAssociation = [];
            var timeoffrequestSearchObj = search.create({
                type: "customrecord_sr_pc_time_off_assoc",
                filters: [
                    ["isinactive","anyof","F"], "AND",
                    ["custrecord_sr_pc_time_off_header","is", intPayCycleId]
                ],
                columns: [
                    search.createColumn({ name: "internalid"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_record"}),
                    search.createColumn({ name: "custrecord_sr_pc_time_off_employee"}),
                    search.createColumn({ name: "custrecord_timeofftype_paycode"}),
                    search.createColumn({ name: "custrecord_timeofftype"}),
                    search.createColumn({ name: "custrecord_startdate"}),
                    search.createColumn({ name: "custrecord_enddate"}),
                    search.createColumn({ name: "custrecord_sr_pc_amount_of_time"})
                ]
            });

            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            if(searchResultCount != 0) {
                timeoffrequestSearchObj.run().each(function(result){
                    arrTimeOffRequestsAssociation.push({
                        recordid: result.id,
                        custrecord_sr_pc_time_off_record: result.getValue({ name: "custrecord_sr_pc_time_off_record"}),
                        custrecord_sr_pc_time_off_employee: result.getValue({ name: "custrecord_sr_pc_time_off_employee"}),
                        custrecord_timeofftype_paycode: result.getValue({ name: "custrecord_timeofftype_paycode"}),
                        custrecord_timeofftype: result.getText({ name: "custrecord_timeofftype"}),
                        custrecord_startdate: result.getValue({ name: "custrecord_startdate"}),
                        custrecord_enddate: result.getValue({ name: "custrecord_enddate"}),
                        custrecord_sr_pc_amount_of_time: result.getValue({ name: "custrecord_sr_pc_amount_of_time"})
                    });
                    return true;
                });
            }

            return arrTimeOffRequestsAssociation;

        }

        fn.getPayCycleLinesPerPayCycle = function(intPayCycleId) {
            var arrData = [];
            var filters = [
                ["custrecord_sr_pcl_paycycleheader","anyof", [intPayCycleId]]
            ];
            var columns = [search.createColumn({ name: "internalid"})];
            var payCycleLineSearchObj = fn.runSearch("customrecord_sr_pay_cycle_lines", null, filters, columns);
            if(payCycleLineSearchObj.length != 0) {
                for(var intIndex=0; intIndex<payCycleLineSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: payCycleLineSearchObj[intIndex].id
                    });
                }
            }
            return arrData;
        }

        fn.getEmployeeAssociationsPerPayCycle = function(intPayCycleId) {
            var arrData = [];
            var filters = [
                ["custrecord_sr_pc_pay_cycle_header","anyof", [intPayCycleId]]
            ];
            var columns = [search.createColumn({ name: "internalid"})];
            var employeeAssociationSearchObj = fn.runSearch("customrecord_sr_pay_cycle_employee", null, filters, columns);
            if(employeeAssociationSearchObj.length != 0) {
                for(var intIndex=0; intIndex<employeeAssociationSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: employeeAssociationSearchObj[intIndex].id
                    });
                }
            }
            return arrData;
        }


        fn.getEmployeeCommissions = function(arrEmployeeIds, dtStartDate, dtEndDate) {
            var arrData = [];
            var filters = [
                ["mainline","is","T"], "AND",
                ["status","anyof",["Commissn:A","Commissn:X"]], "AND",
                ["trandate","onorbefore", dtEndDate], "AND",
                ["name","anyof",arrEmployeeIds]
            ];
            var columns = [
                search.createColumn({name: "internalid"}),
                search.createColumn({name: "trandate"}),
                search.createColumn({name: "tranid"}),
                search.createColumn({name: "entity"}),
                search.createColumn({name: "memo"}),
                search.createColumn({name: "currency"}),
                search.createColumn({name: "statusref"}),
                search.createColumn({name: "subsidiary"}),
                search.createColumn({name: "account"}),
                search.createColumn({name: "fxamount"})
            ];

            var commissionSearchObj = fn.runSearch("commission",  null, filters, columns);
            if(commissionSearchObj.length != 0) {
                for(var intIndex=0; intIndex<commissionSearchObj.length; intIndex++) {
                    arrData.push({
                        recordid: commissionSearchObj[intIndex].getValue('internalid'),
                        recordtype: "commission",
                        trandate: commissionSearchObj[intIndex].getValue('trandate'),
                        tranid: commissionSearchObj[intIndex].getValue('tranid'),
                        memo: commissionSearchObj[intIndex].getValue('memo'),
                        subsidiary: commissionSearchObj[intIndex].getValue('subsidiary'),
                        currency: commissionSearchObj[intIndex].getValue('currency'),
                        entityid: commissionSearchObj[intIndex].getValue('entity'),
                        entityname: commissionSearchObj[intIndex].getText('entity'),
                        accountid: commissionSearchObj[intIndex].getValue('account'),
                        accountname: commissionSearchObj[intIndex].getText('account'),
                        fxamount: commissionSearchObj[intIndex].getValue('fxamount'),
                        status: commissionSearchObj[intIndex].getValue('statusref'),
                        statustext: commissionSearchObj[intIndex].getText('statusref')
                    });
                }
            }

            return arrData;

        }

        fn.getPayCycleAllowancePayments = function(intPayCycleId, arrPayCycleLineIds) {
            var arrData = [];
            if(arrPayCycleLineIds.length == 0) { return arrData; }
            var filters = [
                ["custrecord_sr_pay_cycle_line_header", "anyof", arrPayCycleLineIds],"AND",
                ["custrecord_sr_pay_cycle_header","anyof",[intPayCycleId]]
            ];
            var columns = [
                search.createColumn({name: "custrecord_sr_pay_cycle_line_header"}),
                search.createColumn({name: "custrecord_sr_pay_cycle_header"}),
                search.createColumn({name: "custrecord_sr_allowance_amount_paid"}),
                search.createColumn({name: "custrecord_sr_allowance_date_paid"})
            ];

            var allowanceSearchObj = fn.runSearch("customrecord_sr_pc_allowance_payment",  null, filters, columns);
            if(allowanceSearchObj.length != 0) {
                for(var intIndex=0; intIndex<allowanceSearchObj.length; intIndex++) {
                    arrData.push({
                        allowancepaymentid: allowanceSearchObj[intIndex].id,
                        paycyclelineid : allowanceSearchObj[intIndex].getValue('custrecord_sr_pay_cycle_line_header'),
                        paycycleid : allowanceSearchObj[intIndex].getValue('custrecord_sr_pay_cycle_header'),
                        amountpaid : allowanceSearchObj[intIndex].getValue('custrecord_sr_allowance_amount_paid'),
                        datepaid : allowanceSearchObj[intIndex].getValue('custrecord_sr_allowance_date_paid')
                    });
                }
            }

            return arrData;
        }

        fn.csvHeader = [
            'Employee_Code',
            'Cost_Centre_Code',
            'Paycode_ID',
            'Quantity',
            'Payroll_Start',
            'Payroll_End',
            'Leave_Start',
            'Leave_End',
            'Number of Pays',
            'Alternative Rate'
        ]

        fn.existInArrTimeOffTypes = function(arrTimeOffTypes, stTimeOffTypes) {
            var blExist = false;
            for(var intIndex in arrTimeOffTypes) {
                if(arrTimeOffTypes[intIndex] == stTimeOffTypes) {
                    blExist = true;
                }
            }
            return blExist;
        }

        fn.getURL = function(stScript,stDeployment) {
            var urlLink =  url.resolveScript({
                scriptId: stScript,
                deploymentId: stDeployment,
                returnExternalUrl: false
            });

            return urlLink;
        }

        fn.runSearch =  function(recType, searchId, filters, columns) {
            var srchObj = null;
            var arrSearchResults = [];
            var arrResultSet = null;
            var intSearchIndex = 0;

            // if search is ad-hoc (created via script)
            if (searchId == null || searchId == '') {
                srchObj = search.create({
                    type : recType,
                    filters : filters,
                    columns : columns
                });
            } else { // if there is an existing saved search called and used inside the script
                srchObj = search.load({
                    id : searchId
                });
                var existFilters = srchObj.filters;
                var existColumns = srchObj.columns;

                var arrNewFilters = [];
                var bIsResultsWithSummary = false;

                for (var i = 0; i < existFilters.length; i++) {
                    var stFilters = JSON.stringify(existFilters[i]);
                    var objFilters = JSON.parse(stFilters);

                    var objFilter = search.createFilter({
                        name : objFilters.name,
                        join : objFilters.join,
                        operator : objFilters.operator,
                        values : objFilters.values,
                        formula : objFilters.formula,
                        summary : objFilters.summary
                    });

                    arrNewFilters.push(objFilter);
                }

                existFilters = (existFilters == null || existFilters == '') ? new Array() : existFilters;
                existColumns = (existColumns == null || existColumns == '') ? new Array() : existColumns;

                // include additional filters created via script
                if (filters != null && filters != '') {
                    for (var idx = 0; idx < filters.length; idx++) {
                        existFilters.push(filters[idx]);
                    }
                }

                //  log.debug('Filter', JSON.stringify(existFilters));

                // include additional columns created via script
                if (columns != null && columns != '')
                {
                    for (var idx = 0; idx < columns.length; idx++)
                    {
                        existColumns.push(columns[idx]);
                    }
                }

                for (var i = 0; i < existColumns.length; i++)
                {
                    var stColumns = JSON.stringify(existColumns[i]);
                    var objColumns = JSON.parse(stColumns);

                    if (objColumns.summary != null)
                    {
                        bIsResultsWithSummary = true;
                        break;
                    }
                }

                if (!bIsResultsWithSummary)
                {
                    existColumns.push(search.createColumn({
                        name : 'internalid'
                    }));
                }
                else
                {
                    existColumns.push(search.createColumn({
                        name : 'internalid',
                        summary : 'GROUP'
                    }));
                }

                // reset original filters and columns to original ones + those passed via script
                srchObj.filters = existFilters;
                srchObj.columns = existColumns;
            }

            var objRS = srchObj.run();

            // do the logic below to get all the search results because if not, you will only get 4000 max results
            do {
                arrResultSet = objRS.getRange(intSearchIndex, intSearchIndex + 1000);
                if (!(arrResultSet))
                {
                    break;
                }

                arrSearchResults = arrSearchResults.concat(arrResultSet);
                intSearchIndex = arrSearchResults.length;
            } while (arrResultSet.length >= 1000);

            var objResults = {};
            objResults.resultSet = objRS;
            objResults.actualResults = arrSearchResults;
            objResults.stSearchRecType = srchObj.searchType;

            return  objResults.actualResults;
        }

        return fn;

    });