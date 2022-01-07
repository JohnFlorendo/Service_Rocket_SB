define(['N/runtime', 'N/record', 'N/search', 'N/url'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    function (runtime, record, search, url) {
        var fn = {};

        const IN_PROGRESS_GREEN = 22;
        const REVIEW = 21;
        const EXECUTION = 2;
        const IN_PROGRESS_RED = 24;
        fn.getAllProject = function () {
            var jobSearchObj = search.create({
                type: "job",
                filters:
                    [
                        ["status", "anyof", IN_PROGRESS_GREEN, REVIEW, EXECUTION, IN_PROGRESS_RED]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "entityid", label: "Name"}),
                        search.createColumn({name: "entitystatus", label: "Status"}),
                        search.createColumn({
                            name: "startdate",
                            sort: search.Sort.DESC,
                            label: "Start Date"
                        }),
                        search.createColumn({
                            name: "projectedenddate",
                            sort: search.Sort.ASC,
                            label: "Projected End Date"
                        }),
                        search.createColumn({name: "percentcomplete", label: "Percent Complete"})
                    ]
            });
            var pagedData = jobSearchObj.runPaged({pageSize: 1000});
            return page(pagedData);
        }
        
        function page(pagedData) {
            var arr = [];
            var count = 0;
            //log.debug("pagedData", pagedData);
            // iterate the pages
            for (var i = 0; i < pagedData.pageRanges.length; i++) {
                //log.debug("pagedData.pageRanges.length:", pagedData.pageRanges.length);
                //log.debug("counter:", count++);
                var currentPage = pagedData.fetch(i);
                //log.debug("currentPage", currentPage);
                currentPage.data.forEach(function (result) {
                    var objResult = {};
                    objResult.internalid = result.getValue("internalid");
                    objResult.entityid = result.getValue("entityid")
                    arr.push(objResult);
                });
                //log.debug("arr1", arr);
            }
            return arr;
        }
        
        fn.consolidateProject = function (intProjectId) {
            try {
                if (intProjectId) {
                    log.debug("intProjectId", intProjectId);
                    var arrProjects = [];
                    var arrResult = intProjectId.split(',');
                    log.debug("arrresult", arrResult);
                    if (arrResult.length > 0) {
                        for (var indx = 0; indx < arrResult.length; indx++) {
                            var objProject = {};
                            objProject.internalid = arrResult[indx].replace(/\s/g, "") ;
                            objProject.entityid = "";
                            arrProjects.push(objProject);
                        }
                        log.debug("consolidateProject arrProjects", arrProjects);
                        return arrProjects;
                    }
                } else {
                    var arrProjects = fn.getAllProject();
                    log.debug("arrProjects", arrProjects);
                    return arrProjects;
                }
            } catch (e) {
                log.debug("consolidateProject, error:", e);
            }
        }
        
        fn.searchTotalBilledHours = function (intProject) {
            var quantity;
            try {
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["item.type", "anyof", "Service"],
                            "AND",
                            ["jobmain.internalid","anyof",intProject]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "quantity",
                                summary: "SUM",
                                label: "Quantity"
                            })
                        ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                //log.debug("invoiceSearchObj result count", searchResultCount);
                invoiceSearchObj.run().each(function (result) {
                    quantity = result.getValue({ name:"quantity", summary: "SUM"});
                    return true;
                });
                return quantity;
            } catch (e) {
                log.debug("error searchTotalBilledHours:", e);
            }
            
        }
        
        
        fn.searchTotalSalesOrder = function (intProjectId) {
            var quantity;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["item.type", "anyof", "Service"],
                            "AND",
                            ["jobmain.internalid","anyof",intProjectId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "quantity",
                                summary: "SUM",
                                label: "Quantity"
                            })
                        ]
                });
                var searchResultCount = salesorderSearchObj.runPaged().count;
                //log.debug("salesorderSearchObj result count", searchResultCount);
                salesorderSearchObj.run().each(function (result) {
                    quantity = result.getValue({name: "quantity", summary: "SUM"});
                    
                    return true;
                });
                return quantity;
            } catch (e) {
                log.debug("error searchTotalSalesOrder:", e);
            }
        }
        
        
        fn.searchProjectSalesOrder = function (intProjectId) {
            var numMinimumOf;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["jobmain.internalid","anyof",intProjectId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "tranid",
                                summary: "MIN",
                                label: "Document Number"
                            })
                        ]
                });
                var searchResultCount = salesorderSearchObj.runPaged().count;
                //log.debug("salesorderSearchObj result count", searchResultCount);
                salesorderSearchObj.run().each(function (result) {
                    numMinimumOf = result.getValue({
                        name: "tranid",
                        summary: "MIN"
                    })
                    return true;
                });
            } catch (e) {
                log.debug("exception searchProjectSalesOrder:", e);
            }
            return (numMinimumOf) ? numMinimumOf : 0;
        }
        
        fn.loadProjectRecord = function (intJobId) {
            try {
                var decProjectSalesOrder = fn.searchProjectSalesOrder(intJobId);
                log.debug("decProjectSalesOrder", decProjectSalesOrder);
                var decPrepaidRates = fn.searchPredpaidRates(intJobId);
                log.debug("decPrepaidRates", decPrepaidRates);
                var decTotalSalesOrder = fn.searchTotalSalesOrder(intJobId);
                log.debug("decTotalSalesOrder", decTotalSalesOrder);
                var decTotalBilledHours = fn.searchTotalBilledHours(intJobId);
                log.debug("decTotalBilledHours", decTotalBilledHours);
                var intProjectId = record.submitFields({
                    type: 'job',
                    id: intJobId,
                    values: {
                        "custentity_so_prepaidrate": decPrepaidRates,
                        "custentity_prepaidrate_override": "",
                        "custentitytotal_salesorder_hours": decTotalSalesOrder,
                        "custentity_inv_totalbilledhours": decTotalBilledHours,
                        "custentity_project_salesorder": decProjectSalesOrder
                    }
                });
                if (intProjectId) {
                    var objResult = fn.loadProjectResponse("", intProjectId);
                    log.debug("objResult", objResult);
                    return objResult;
                }
            } catch (e) {
                log.debug("exception loadProjectRecord:", e);
                return fn.loadProjectResponse(e, intJobId);
            }
        }
        
        fn.loadProjectResponse = function (exception, id) {
            return {
                projectId: id,
                status: (exception.message) ? "failed" : "success",
                hasError: (exception.message) ? true : false,
                errorMessage: (exception.message) ? exception.message : ""
            }
            
        }
        
        fn.projectMRLog = function (arrErrorMessage, errorCount) {
            var objErrorMessage = {};
            var arrError = [];
            try {
                var recLog = record.create({
                    type: "customrecord_update_project_field_logger",
                });
                //log.debug("arrErrorMessage:", arrErrorMessage);
                recLog.setValue("name", formatDate(new Date()));
                recLog.setValue("custrecord_error_count", errorCount);
                for (var index in arrErrorMessage) {
                    objErrorMessage.projectId = arrErrorMessage[index].projectId;
                    objErrorMessage.errorMessage = arrErrorMessage[index].errorMessage;
                    arrError.push(objErrorMessage);
                }
                recLog.setValue("custrecord_logs", (arrError.length > 0) ? JSON.stringify(arrError) : "");
                recLog.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });
                
            } catch (e) {
                log.error('projectMRLog error:', e);
            }
        }
        
        
        function formatDate(date) { // This is to display 12 hour format like you asked
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            var displayDate = date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + strTime;
            return displayDate;
        }

        /**
         * Charge-Based Billing Schedules
         */
        const TIME_MATERIALS_PREPAID = 9;
        const TIME_MATERIALS_POSTPAID_MONTHLY = 10;
        const SCHEDULED = 11;
        const FIXED_PRICE = 12;
        const TIME_MATERIALS_POSTPAID_SEMI_MONTHLY = 13;
        const TIME_MATERIALS_PREPAID_QUARTERLY = 14;
        const FIXED_PRICE_PREPAID_QUARTERLY = 15;
        fn.searchPredpaidRates = function (intProjectId) {
            var currency;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["jobmain.billingschedule", "anyof", FIXED_PRICE_PREPAID_QUARTERLY, TIME_MATERIALS_PREPAID, TIME_MATERIALS_PREPAID_QUARTERLY],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["jobmain.internalid","anyof",intProjectId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "formulacurrency",
                                summary: "MAX",
                                formula: "{rate}/{exchangerate}",
                                label: "Formula (Currency)"
                            })
                        ]
                });
                var searchResultCount = salesorderSearchObj.runPaged().count;
                //log.debug("salesorderSearchObj result count", searchResultCount);
                salesorderSearchObj.run().each(function (result) {
                    currency = result.getValue({
                        name: "formulacurrency",
                        summary: "MAX",
                        formula: "{rate}/{exchangerate}"
                    })
                    return true;
                });
                return currency;
            } catch (e) {
                log.debug("error searchPredpaidRates:", e);
                return false;
            }
        }
        return fn;
    });
