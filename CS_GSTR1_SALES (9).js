/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/currentRecord', 'N/url', 'N/https', 'N/ui/message', "../library files/common_2.0", "N/https", "N/url", 'N/search'],

	function (currentRecord, url, https, message, common, https, url, search) {
		var record = currentRecord.get();

		/**
		 * Function to be executed after page is initialized.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
		 *
		 * @since 2015.2
		 */
		var currentRecord;

		function pageInit(scriptContext) {

			currentRecord = scriptContext.currentRecord;
			var post_value = currentRecord.getValue({ fieldId: 'custpage_post_value' });
			if (post_value == 1) {
				var myMsg_val = message.create({
					title: 'Message!',
					message: 'E-invoice cancallation is done please click on back button to cancel another E-invoice',
					type: message.Type.CONFIRMATION,
					duration: 20000
				});
				myMsg_val.show();
			}

		}

		function fieldChanged(context) {
			var currentRecord = context.currentRecord;
			var sublistFieldName = context.fieldId;
			if (sublistFieldName == 'custpage_select_invoice') {
				var select_invoice = currentRecord.getText({ fieldId: 'custpage_select_invoice' });
				if (select_invoice != "") {
					var sub_list = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });

					for (var i = 0; i < sub_list; i++) {
						var doc_number = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_doc_number', line: i });
						if (doc_number == select_invoice) {
							var ei_irn = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_ei_irn', line: i });

							currentRecord.setValue({ fieldId: 'custpage_irn_value', value: ei_irn });
							currentRecord.getField("custpage_irn_value").isDisabled = true;



						}

					}

				}

			}



			if (sublistFieldName == 'custpage_start_date' || sublistFieldName == 'custpage_end_date') {
				var start_date = currentRecord.getValue({ fieldId: 'custpage_start_date' });
				var end_date = currentRecord.getValue({ fieldId: 'custpage_end_date' });
				if (start_date != "" && end_date != "") {
					if (start_date > end_date) {
						alert("Please select Valid Start Date and End Date");
					}

				}


			}





		}

		function refreshpage() {
			window.onbeforeunload = null;
			window.location.reload();
		}

		function goBack() {
			history.back();


		}


		function CancelEdoc(context) {




			var select_invoice = currentRecord.getValue({ fieldId: 'custpage_select_invoice' });
			var cancel_reason = currentRecord.getValue({ fieldId: 'custpage_cancel_reason' });
			var cancel_remark = currentRecord.getValue({ fieldId: 'custpage_cancel_remark' });

			if (select_invoice == "") {
				alert("Please Select Invoice To Cancel");
				return false;
			}
			if (cancel_reason == "") {
				alert("Please Select Reason");
				return false;
			}

			if (cancel_remark == "") {
				alert("Please Add Remark");
				return false;
			}


			var token_val = '1.72c9c7a9-68e5-401e-8feb-8e7ed2737de1_2444ec266be118ebaae9a8f0155647798668841fa9b64c7d60e945fc45f22f64';
			var gstin_val = '19AAACH6630G1ZO';

			var headerObj = new Array();
			headerObj['X-Cleartax-Auth-Token'] = token_val;
			headerObj['Content-Type'] = 'application/json';
			headerObj['Accept'] = 'application/json';
			headerObj['gstin'] = gstin_val;
			log.debug('headerObj', headerObj);
			var url_new = 'https://api-sandbox.clear.in/einv/v2/eInvoice/cancel';


			var fieldLookUp = search.lookupFields({
				type: search.Type.INVOICE,
				id: select_invoice,
				columns: ['custbody_in_ei_irn']
			});
			var irn = fieldLookUp.custbody_in_ei_irn;


			psg_ei_content = [
				{
					"irn": irn,
					"CnlRsn": cancel_reason,
					"CnlRem": cancel_remark
				}
			];

			// START :: Cancel E-Way Bill 09/05/2024

			var ewbNo = currentRecord.getValue({ fieldId: 'custbody_in_eway_bill_no' });

			if (ewbNo) {
				var cancellationResult = cancelEWayBill(ewbNo, cancel_reason, cancel_remark);

			}

			function cancelEWayBill(ewbNo, cancel_reason, cancel_remark) {
				var requestBody = {
					"ewbNo": ewbNo,
					"cancelRsnCode": cancel_reason,
					"cancelRmrk": cancel_remark
				};


				var response = https.post({
					url: 'https://api-sandbox.clear.in/einv/v2/eInvoice/ewaybill/cancel',
					body: JSON.stringify(requestBody),
					headers: {
						'Content-Type': 'application/json'
					}
				});

				// Parse the response
				var responseBody = JSON.parse(response.body);

				if (response.code === 200 && responseBody.status === 'success') {
					return { success: true };
				} else {
					return { success: false, message: responseBody.errorMessage };
				}
			}




			// END :: Cancel E-Way Bill 09/05/2024
			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_sl_to_cancel_einvoice',
				deploymentId: 'customdeploy_sl_to_cancel_einvoice'

			});

			var response = https.post({ url: suiteletURL, body: { invoice_data: select_invoice, cancel_reason: cancel_reason, cancel_remark: cancel_remark } });


			alert("IRN cancallation is done");
			window.onbeforeunload = null;
			window.location.reload();


		}




		function generategstrreport(context) {


			var myMsg3 = message.create({
				title: 'Message!',
				message: 'GSTR Reporting is in-progress you will receive an email once its completed',
				type: message.Type.INFORMATION,
				duration: 20000
			});
			myMsg3.show();

			var invoice_id = [];
			var acc_period = currentRecord.getValue({ fieldId: 'custpage_period' });
			//alert('acc_period'+acc_period);
			var report_type = currentRecord.getValue({ fieldId: 'custpage_type' });
			//	alert('report_type'+report_type);
			var custpage_gstin = currentRecord.getValue({ fieldId: 'custpage_gstin' });
			//	alert('custpage_gstin'+custpage_gstin);



			var suiteletURL1 = url.resolveScript({
				scriptId: 'customscript_sl_to_gen_gstr_report',
				deploymentId: 'customdeploy_sl_to_gen_gstr_report'

			});
			//	alert ('suiteletURL1'+suiteletURL1);
			var response = https.post({ url: suiteletURL1, body: { acc_period: acc_period, report_type: report_type, custpage_gstin: custpage_gstin } });

			 if(response){
				var suiteletURL2 = url.resolveScript({
			 		scriptId: 'customscript_sl_call_sh_status',
			 		deploymentId: 'customdeploy_sl_call_sh_status'
	
			 	});
	   //   alert ('Call Suitelet');

              window.open(suiteletURL2,'_blank')
			 }


		}



		function generateEdoc(context) {


			var myMsg3 = message.create({
				title: 'Message!',
				message: 'E-Documents Generation and Certification is in-progress you will receive an email once its completed',
				type: message.Type.INFORMATION,
				duration: 20000
			});
			myMsg3.show();

			var invoice_id = [];
			var payee_list = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });

			var ei_status_old = 0;
			for (var i = 0; i < payee_list; i++) {
				var checkbox_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_checkbox', line: i });
				if (checkbox_id == true) {
					var internal_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_internal_id', line: i });
					invoice_id.push(internal_id);
				}

			}


			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_eincoice_task_call',
				deploymentId: 'customdeploy_eincoice_task_call'

			});

			var response = https.post({ url: suiteletURL, body: { invoice_data: JSON.stringify(invoice_id) } });



		}


		function generateEdocBill(context) {


			var myMsg3 = message.create({
				title: 'Message!',
				message: 'E-Documents Generation and Certification is in-progress you will receive an email once its completed',
				type: message.Type.INFORMATION,
				duration: 20000
			});
			myMsg3.show();

			var invoice_id = [];
			var payee_list = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });

			var ei_status_old = 0;
			for (var i = 0; i < payee_list; i++) {
				var checkbox_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_checkbox', line: i });
				if (checkbox_id == true) {
					var internal_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_internal_id', line: i });
					invoice_id.push(internal_id);
				}

			}


			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_eincoice_task_call_bill',
				deploymentId: 'customdeploy_eincoice_task_call_bill'

			});

			var response = https.post({ url: suiteletURL, body: { invoice_data: JSON.stringify(invoice_id) } });



		}

		function sendEdocBill(context) {


			var myMsg3 = message.create({
				title: 'Message!',
				message: 'E-Documents Sending is in-progress you will receive an email once its completed',
				type: message.Type.INFORMATION,
				duration: 20000
			});
			myMsg3.show();

			var invoice_id = [];
			var payee_list = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });

			var ei_status_old = 0;
			for (var i = 0; i < payee_list; i++) {
				var checkbox_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_checkbox', line: i });
				if (checkbox_id == true) {
					var internal_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_internal_id', line: i });
					invoice_id.push(internal_id);
				}

			}


			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_sl_to_generates_edoc_email',
				deploymentId: 'customdeploy_sl_to_generates_edoc_email'

			});

			var response = https.post({ url: suiteletURL, body: { invoice_data: JSON.stringify(invoice_id) } });



		}

		function sendEdoc(context) {


			var myMsg3 = message.create({
				title: 'Message!',
				message: 'E-Documents Sending is in-progress you will receive an email once its completed',
				type: message.Type.INFORMATION,
				duration: 20000
			});
			myMsg3.show();

			var invoice_id = [];
			var payee_list = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });

			var ei_status_old = 0;
			for (var i = 0; i < payee_list; i++) {
				var checkbox_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_checkbox', line: i });
				if (checkbox_id == true) {
					var internal_id = currentRecord.getSublistValue({ sublistId: 'custpage_sublist', fieldId: 'custpage_internal_id', line: i });
					invoice_id.push(internal_id);
				}

			}


			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_sl_to_generates_edoc_email',
				deploymentId: 'customdeploy_sl_to_generates_edoc_email'

			});

			var response = https.post({ url: suiteletURL, body: { invoice_data: JSON.stringify(invoice_id) } });



		}


		function exportToExcel(context) {

			currentRecord.setValue({ fieldId: 'custpage_submitter', value: 'submit_button_1' });
			document.forms['main_form'].submit();



		}
     
function redirectToRecord() {
    var recordId = 2;
    var recordURL = url.resolveRecord({
        recordType: 'customrecord_gstr_file_record',
        recordId: recordId,
        isEditMode: false
    });
    window.location.href = recordURL;
}
		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			generateEdoc: generateEdoc,
			generateEdocBill: generateEdocBill,
			generategstrreport: generategstrreport,
			sendEdocBill: sendEdocBill,
			sendEdoc: sendEdoc,
			goBack: goBack,
			CancelEdoc: CancelEdoc,
			exportToExcel: exportToExcel,
            redirectToRecord: redirectToRecord,
			refreshpage: refreshpage
		};

	});