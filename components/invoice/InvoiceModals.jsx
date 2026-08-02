"use client";

import CustomerSearchModal from "@/components/CustomerSearchModal";
import CreateCustomerModal from "@/components/customers/CreateCustomerModal";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import CreateJobModal from "@/components/CreateJobModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import ConfirmModal from "@/components/ConfirmModal";
import DiscountModal from "@/components/modals/DiscountModal";

export default function InvoiceModals({
  mode,

  invoice,
  invoiceId,
  invoiceNumber,

  selectedClient,
  setSelectedClient,

  settings,

  issuedAt,
  expiryDate,
  customerNotes,

  items,

  total,
  balance,
  subtotal,

  payments,
  setPayments,

  appliedDiscounts,
  setAppliedDiscounts,

  jobInfo,
  setJobInfo,

  invoiceReadyRef,

  showCustomerModal,
  setShowCustomerModal,

  showCreateCustomerModal,
  setShowCreateCustomerModal,

  showRecordPaymentModal,
  setShowRecordPaymentModal,

  showVoidModal,
  setShowVoidModal,

  showCancelJobDialog,
  setShowCancelJobDialog,

  showDiscountModal,
  setShowDiscountModal,

  showCreateJobModal,
  setShowCreateJobModal,

  setInvoice,
  setInvoiceId,
  setInvoiceNumber,

  executeVoid,

  router,
}) {
  async function createInvoiceForCustomer(customer) {
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: customer.id,
        issuedAt,
        dueDate: expiryDate || null,
        subtotal: 0,
        tax: 0,
        total: 0,
        balance: 0,
        taxEnabled: true,
        taxRate: settings?.defaultTaxRate ?? 0,
        notes: customerNotes || "",
        items: [],
      }),
    });

    const data = await response.json();

    if (!response.ok || data?.error) {
      throw new Error(data?.error || "Create invoice failed");
    }

    setInvoice(data);
    setInvoiceId(data.id);
    setInvoiceNumber(data.invoiceNumber);

    invoiceReadyRef.current = true;

    window.history.replaceState(null, "", `/invoices/${data.id}`);

    return data;
  }

  async function handleCustomerSelected(customer) {
    if (!customer?.id) return;

    const previousCustomer = selectedClient;

    setSelectedClient(customer);
    setShowCustomerModal(false);

    // Si el invoice ya existe, actualizar el cliente en la BD
    if (invoiceId) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: customer.id,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.details || data?.error || "Could not change customer.",
          );
        }

        const updatedClient = data?.client || customer;

        setSelectedClient(updatedClient);

        setInvoice((previousInvoice) => ({
          ...previousInvoice,
          clientId: updatedClient.id,
          client: updatedClient,
        }));

        return;
      } catch (error) {
        console.error("Error changing invoice customer:", error);

        setSelectedClient(previousCustomer);

        alert(
          error instanceof Error ? error.message : "Could not change customer.",
        );

        return;
      }
    }

    // Si todavía no existe invoice, crearlo con ese cliente
    try {
      await createInvoiceForCustomer(customer);
    } catch (error) {
      console.error("Error creating invoice:", error);

      setSelectedClient(previousCustomer);

      alert("Error creating invoice");
    }
  }

  async function handleCustomerCreated(customer) {
    setSelectedClient(customer);
    setShowCreateCustomerModal(false);

    /*
     * Si la factura ya existe, asignamos el cliente.
     */
    if (invoiceId) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: customer.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Could not assign customer.");
        }
      } catch (error) {
        console.error("Error assigning customer to invoice:", error);

        alert("Error assigning customer to invoice");
      }

      return;
    }

    try {
      await createInvoiceForCustomer(customer);
    } catch (error) {
      console.error("Error creating invoice:", error);

      alert("Error creating invoice");
    }
  }

  async function handlePaymentSave(payment) {
    if (!invoiceId) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(payment.amount),
          method: payment.paymentMethod,
          note: payment.note,
          processingFee: Number(payment.processingFee || 0),
          paidOn: payment.paidOn,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save payment.");
      }

      const paymentsResponse = await fetch(
        `/api/invoices/${invoiceId}/payments`,
        {
          cache: "no-store",
        },
      );

      if (!paymentsResponse.ok) {
        throw new Error("Could not refresh payments.");
      }

      const updatedPayments = await paymentsResponse.json();

      setPayments(Array.isArray(updatedPayments) ? updatedPayments : []);

      setShowRecordPaymentModal(false);
    } catch (error) {
      console.error("Error saving payment:", error);

      alert("Error saving payment");
    }
  }

  async function handleDiscountApply(discount) {
    if (!invoiceId) return;

    try {
      setAppliedDiscounts(discount ? [discount] : []);

      const amount = discount
        ? discount.type === "percent"
          ? Math.min(subtotal * (Number(discount.value || 0) / 100), subtotal)
          : Math.min(Number(discount.value || 0), subtotal)
        : 0;

      const response = await fetch(`/api/invoices/${invoiceId}/discount`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discount: discount
            ? {
                id: discount.id,
                type: discount.type,
                value: Number(discount.value || 0),
                amount,
              }
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save discount.");
      }

      setShowDiscountModal(false);
    } catch (error) {
      console.error("Error applying discount:", error);

      alert("Error applying discount");
    }
  }

  async function handleCreateJob() {
    if (!invoiceId) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/create-job`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not create job.");
      }

      const data = await response.json();

      setShowCreateJobModal(false);

      setJobInfo({
        exists: true,
        job: data,
      });

      router.push("/production");
    } catch (error) {
      console.error("Error creating job:", error);

      alert("Error creating job");
    }
  }

  return (
    <>
      {showCustomerModal && (
        <CustomerSearchModal
          onSelect={handleCustomerSelected}
          onClose={() => setShowCustomerModal(false)}
          onAddCustomer={() => {
            setShowCustomerModal(false);
            setShowCreateCustomerModal(true);
          }}
        />
      )}

      {showCreateCustomerModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateCustomerModal(false)}
          onCreated={handleCustomerCreated}
        />
      )}

      {showRecordPaymentModal && (
        <RecordPaymentModal
          invoice={{
            id: invoiceId,
            invoiceNumber,
            total,
            balance,
            publicToken: invoice?.publicToken,
            client: selectedClient,
            items,
          }}
          defaultDepositPercent={settings?.defaultDepositPercent || 50}
          onClose={() => setShowRecordPaymentModal(false)}
          onSave={handlePaymentSave}
        />
      )}

      <ConfirmModal
        open={showVoidModal}
        title="Void Invoice"
        message="Are you sure you want to void this invoice? This action cannot be undone."
        confirmText="Void Invoice"
        cancelText="Cancel"
        danger
        onCancel={() => setShowVoidModal(false)}
        onConfirm={() => {
          if (jobInfo?.exists) {
            setShowVoidModal(false);
            setShowCancelJobDialog(true);
            return;
          }

          executeVoid(false);
        }}
      />

      <ConfirmDialog
        open={showCancelJobDialog}
        onClose={() => setShowCancelJobDialog(false)}
        title="Production Job Found"
        description="This invoice has an associated production job. Do you also want to cancel the production job?"
        icon="warning"
        color="amber"
        primaryText="Cancel Job Too"
        secondaryText="Keep Job"
        onPrimaryAction={() => executeVoid(true)}
        onSecondaryAction={() => executeVoid(false)}
      />

      <DiscountModal
        open={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        discounts={settings?.discountRules || []}
        selectedDiscounts={appliedDiscounts}
        onApply={handleDiscountApply}
      />

      {showCreateJobModal && (
        <CreateJobModal
          invoice={invoice}
          items={items}
          onClose={() => setShowCreateJobModal(false)}
          onCreate={handleCreateJob}
        />
      )}
    </>
  );
}
