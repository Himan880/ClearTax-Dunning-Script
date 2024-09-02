/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/currentRecord', 'N/search', 'N/record', 'N/format', 'N/url'], function(dialog, currentRecord, search, record, format, url) {

function saveRecord(context) {
    var currentRecord = context.currentRecord;
    var sublistId = 'custpage_sublist'; 
    var checkboxFieldId = 'custpage_checkbox'; 
    var emailFieldId = 'custpage_emailto'; 
	var emailStatus = 'custpage_emailstatus';
    var sublistLineCount = currentRecord.getLineCount({ sublistId: sublistId });
    var anyChecked = false;

    for (var i = 0; i < sublistLineCount; i++) {
        var isChecked = currentRecord.getSublistValue({
            sublistId: sublistId,
            fieldId: checkboxFieldId,
            line: i
        });

        if (isChecked) {
            anyChecked = true;
            var toEmail = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: emailFieldId,
                line: i
            });
            if (!toEmail || toEmail == '- None -') {
                dialog.alert({
                    title: 'Validation Error',
                    message: 'Enter the To-Email field.'
                });
                return false; 
            }

            // Check email send status
            var emailStatusCheck = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: emailStatus,
                line: i
            });
			//alert ('emailStatusCheck'+emailStatusCheck);
            if (emailStatusCheck == 1) {
                dialog.alert({
                    title: 'Email Status',
                    message: 'Email is already sent for this Invoice.'
                });
                return false; 
            }
        }
    }
		
    if (!anyChecked) {
        dialog.alert({
            title: 'Validation Error',
            message: 'At least one checkbox must be checked before Send email.'
        });
        return false; 
    }

    return true; 
}



    function filterButtonClick(context) {
        try {
            var objRecord = currentRecord.get();

            var customerID = objRecord.getValue({ fieldId: "custpage_customer" });
            var subsidiary = objRecord.getValue({ fieldId: "custpage_subsidiary" });
            var dunning_procedure = objRecord.getValue({ fieldId: "custpage_dunning_procedure" });
		   // var emailFilter = objRecord.getValue({ fieldId: "custpage_emailfilterstatus" });

            var daysoverdue;
            if (dunning_procedure == 4) {
                daysoverdue = 16;
            } else if (dunning_procedure == 5) {
                daysoverdue = 30;
            } else if (dunning_procedure == 6) {
                daysoverdue = 60;
            } else if (dunning_procedure == 7) {
                daysoverdue = 90;
            }

            var output = url.resolveScript({
                scriptId: 'customscriptsl_dunning_email_sending_que',
                deploymentId: 'customdeploy_sl_dunning_email_sending_qu',
               // returnExternalUrl: true,
                params: {
                    'custpage_customer': customerID,
                   // 'custpage_emailfilterstatus' : emailFilter,
                    'custpage_subsidiary': subsidiary,
                    'custpage_dunning_procedure': dunning_procedure,
                    'daysoverdue': daysoverdue
                }
            });

            console.log(output);
          top.window.onbeforeunload = null;
top.window.onunload = null;
top.window.location = output
			
       
        }
		catch (e) {
            console.log("Error setting sublist value", e);
        }

        console.log("success");
    }

    return {
        saveRecord: saveRecord,
        filterButtonClick: filterButtonClick
    };
});
