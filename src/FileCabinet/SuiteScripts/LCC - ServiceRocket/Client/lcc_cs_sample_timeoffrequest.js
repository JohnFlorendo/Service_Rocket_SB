/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*
ID : customscript_lcc_cs_paycycle_validation
Name : LCC CS Pay Cycle Validation
Purpose : This is a standalone client script for Service Rocket
Created On : September 10, 2020
Author : LCC
Script Type : Client Script
Saved Searches : NONE
*/

define(['N/search', 'N/record'],function(search, record) {
    var objTimeOffTypes = {};

    function pageInit(context) {
        alert(1);
    }

    return { pageInit: pageInit };
});