// src/pages/CustomerDetailPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentsIcon from "@mui/icons-material/Payments";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";

const API_BASE = "http://localhost:8000/api/";

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit sale dialog
  const [saleEditOpen, setSaleEditOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [editingSaleItems, setEditingSaleItems] = useState([]); // [{variant, variant_name, quantity, price_at_sale}]

  // Edit payment dialog
  const [paymentEditOpen, setPaymentEditOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState("");

  useEffect(() => {
    fetchCustomerDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}customer-detail/${customerId}/`);
      setCustomer(res.data.customer || null);
      setSales(res.data.sales || []);
      setPayments(res.data.payments || []);
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Failed to load customer detail:", err);
      toast.error("Failed to load customer details.");
      setCustomer(null);
      setSales([]);
      setPayments([]);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Sale: open edit modal -----------------
  const openSaleEdit = (sale) => {
    // copy items into editable structure
    const items = (sale.items || []).map(i => ({
      variant: i.variant,
      variant_name: i.variant_name,
      quantity: Number(i.quantity),
      price_at_sale: Number(i.price_at_sale)
    }));
    setEditingSale(sale);
    setEditingSaleItems(items);
    setSaleEditOpen(true);
  };

  const closeSaleEdit = () => {
    setSaleEditOpen(false);
    setEditingSale(null);
    setEditingSaleItems([]);
  };

  const updateSaleItem = (index, field, value) => {
    setEditingSaleItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === "quantity" || field === "price_at_sale" ? Number(value) : value };
      return copy;
    });
  };

  const addSaleItemRow = () => {
    setEditingSaleItems(prev => [...prev, { variant: null, variant_name: "Select variant", quantity: 1, price_at_sale: 0 }]);
  };

  const removeSaleItemRow = (idx) => {
    setEditingSaleItems(prev => prev.filter((_, i) => i !== idx));
  };

  const submitSaleUpdate = async () => {
    if (!editingSale) return;
    // Validate items
    if (!Array.isArray(editingSaleItems) || editingSaleItems.length === 0) {
      toast.warn("Sale must have at least one item.");
      return;
    }
    const itemsPayload = editingSaleItems.map(i => ({
      variant: i.variant,
      quantity: Number(i.quantity),
      price_at_sale: Number(i.price_at_sale)
    }));
    const payload = {
      customer: editingSale.customer, // keep same
      items: itemsPayload
    };
    try {
      // Attempt to PUT updated sale (requires backend nested update support)
      await axios.put(`${API_BASE}sales/${editingSale.id}/`, payload);
      toast.success("Sale updated.");
      closeSaleEdit();
      fetchCustomerDetail();
    } catch (err) {
      console.error("Failed to update sale:", err?.response?.data || err);
      toast.error("Failed to update sale. Ensure backend supports nested sale updates.");
    }
  };

  const deleteSale = async (saleId) => {
    if (!window.confirm("Delete this sale? This will affect stock and cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}sales/${saleId}/`);
      toast.success("Sale deleted.");
      fetchCustomerDetail();
    } catch (err) {
      console.error("Failed to delete sale:", err);
      toast.error("Failed to delete sale. It may be linked to other records.");
    }
  };

  // ----------------- Payment: edit/delete -----------------
  const openPaymentEdit = (payment) => {
    setEditingPayment(payment);
    setEditingPaymentAmount(Number(payment.amount));
    setPaymentEditOpen(true);
  };

  const closePaymentEdit = () => {
    setEditingPayment(null);
    setEditingPaymentAmount("");
    setPaymentEditOpen(false);
  };

  const submitPaymentUpdate = async () => {
    if (!editingPayment) return;
    if (!(Number(editingPaymentAmount) > 0)) {
      toast.warn("Enter a valid amount.");
      return;
    }
    try {
      // Only update amount (we keep payment_date read-only)
      await axios.patch(`${API_BASE}payments/${editingPayment.id}/`, { amount: Number(editingPaymentAmount) });
      toast.success("Payment updated.");
      closePaymentEdit();
      fetchCustomerDetail();
    } catch (err) {
      console.error("Failed to update payment:", err?.response?.data || err);
      toast.error("Failed to update payment.");
    }
  };

  const deletePayment = async (paymentId) => {
    if (!window.confirm("Delete this payment? This will affect the customer's balance.")) return;
    try {
      await axios.delete(`${API_BASE}payments/${paymentId}/`);
      toast.success("Payment deleted.");
      fetchCustomerDetail();
    } catch (err) {
      console.error("Failed to delete payment:", err);
      toast.error("Failed to delete payment.");
    }
  };

  // ----------------- Export CSV (improved) -----------------
  const exportCSV = () => {
    const rows = [];
    rows.push(["Type", "Date", "Description", "Amount (₹)"]);

    // Sales
    sales.forEach(sale => {
      const desc = (sale.items || []).map(it => `${it.variant_name} (${it.quantity}×${it.price_at_sale})`).join(" ; ");
      const total = (sale.items || []).reduce((s, it) => s + Number(it.quantity) * Number(it.price_at_sale), 0);
      rows.push(["Sale", new Date(sale.sale_date).toISOString(), desc, total.toFixed(2)]);
    });

    // Payments
    payments.forEach(p => {
      rows.push(["Payment", new Date(p.payment_date).toISOString(), "Payment received", Number(p.amount).toFixed(2)]);
    });

    // build CSV text
    const csvContent = rows.map(r => r.map(cell => {
      if (cell === null || cell === undefined) return '""';
      const text = String(cell);
      if (/[,"\n]/.test(text)) return `"${text.replaceAll('"','""')}"`;
      return text;
    }).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `customer_${customerId}_statement.csv`;
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };

  // ----------------- Export PDF via print window -----------------
  const exportPDF = () => {
    // Create a new window with printable HTML
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      toast.error("Popup blocked. Allow popups for this site to generate PDF.");
      return;
    }
    const html = `
      <html>
      <head>
        <title>Customer Statement</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #222 }
          h1 { margin-bottom: 4px }
          .meta { margin-bottom: 12px; color: #555 }
          table { width: 100%; border-collapse: collapse; margin-top: 12px }
          th, td { padding: 8px; border: 1px solid #ddd; text-align: left }
          th { background: #f5f5f5 }
          .right { text-align: right }
        </style>
      </head>
      <body>
        <h1>Customer: ${customer?.name || ""}</h1>
        <div class="meta">Mobile: ${customer?.mobile || "N/A"} &nbsp; | &nbsp; Address: ${customer?.address || "N/A"} &nbsp; | &nbsp; Balance: ₹${Number(balance || 0).toFixed(2)}</div>

        <h2>Transactions</h2>
        <table>
          <thead>
            <tr><th>Type</th><th>Date</th><th>Description</th><th class="right">Amount (₹)</th></tr>
          </thead>
          <tbody>
            ${sales.map(sale => {
              const desc = (sale.items || []).map(it => `${it.variant_name} (${it.quantity}×${it.price_at_sale})`).join(" ; ");
              const total = (sale.items || []).reduce((su, it) => su + Number(it.quantity) * Number(it.price_at_sale), 0);
              return `<tr><td>Sale</td><td>${new Date(sale.sale_date).toLocaleString()}</td><td>${desc}</td><td class="right">${total.toFixed(2)}</td></tr>`;
            }).join("")}
            ${payments.map(p => `<tr><td>Payment</td><td>${new Date(p.payment_date).toLocaleString()}</td><td>Payment received</td><td class="right">${Number(p.amount).toFixed(2)}</td></tr>`).join("")}
          </tbody>
        </table>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Customer not found.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/customers")}>
          Back to Customers
        </Button>
      </Box>
    );
  }

  const numericBalance = parseFloat(balance || 0);

  return (
    <Box sx={{ width: "100%", pr: 4, pl: 3 }}>
      {/* Header with actions */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PersonIcon sx={{ fontSize: 38, mr: 1.5, color: "#6A1B9A" }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer ID: {customer.id}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Export transactions as CSV">
            <IconButton color="primary" onClick={exportCSV}><FileDownloadIcon /></IconButton>
          </Tooltip>

          <Tooltip title="Export / Print PDF">
            <IconButton color="primary" onClick={exportPDF}><PrintIcon /></IconButton>
          </Tooltip>

          <Tooltip title="Delete customer">
            <IconButton color="error" onClick={async () => {
              if (!window.confirm("Delete this customer and related records? This cannot be undone.")) return;
              try {
                await axios.delete(`${API_BASE}customers/${customerId}/`);
                toast.success("Customer deleted.");
                navigate("/customers");
              } catch (err) {
                console.error("Failed to delete customer:", err);
                toast.error("Failed to delete customer.");
              }
            }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Customer info card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
              <Typography variant="h6">{customer.mobile || "N/A"}</Typography>
            </Grid>

            <Grid item xs={12} sm={5}>
              <Typography variant="subtitle2" color="text.secondary">Address</Typography>
              <Typography variant="h6">{customer.address || "N/A"}</Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2" color="text.secondary">Balance</Typography>
              <Chip label={`₹${numericBalance.toFixed(2)}`} color={numericBalance > 0 ? "error" : "success"} sx={{ fontSize: "1rem", px: 2, py: 1, mt: 1 }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* SALES */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ShoppingCartIcon sx={{ color: "#1976D2", fontSize: 28, mr: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Sales History</Typography>
              </Box>

              {sales.length === 0 ? (
                <Typography sx={{ mt: 2 }}>No sales recorded yet.</Typography>
              ) : (
                <List>
                  {sales.map((sale) => {
                    const saleTotal = (sale.items || []).reduce((s, it) => s + Number(it.quantity) * Number(it.price_at_sale), 0);
                    return (
                      <Box key={sale.id} sx={{ mb: 1 }}>
                        <Paper elevation={0} sx={{ p: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography sx={{ fontWeight: 600 }}>Sale on {new Date(sale.sale_date).toLocaleDateString()}</Typography>
                            <Box>
                              <Button size="small" startIcon={<EditIcon />} onClick={() => openSaleEdit(sale)}>Edit</Button>
                              <Button size="small" color="error" onClick={() => deleteSale(sale.id)}>Delete</Button>
                            </Box>
                          </Box>

                          <Box sx={{ mt: 1 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Item</TableCell>
                                  <TableCell>Qty</TableCell>
                                  <TableCell>Price</TableCell>
                                  <TableCell align="right">Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(sale.items || []).map((it, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{it.variant_name}</TableCell>
                                    <TableCell>{it.quantity}</TableCell>
                                    <TableCell>₹{Number(it.price_at_sale).toFixed(2)}</TableCell>
                                    <TableCell align="right">₹{(Number(it.quantity) * Number(it.price_at_sale)).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                                  <TableCell align="right"><strong>₹{saleTotal.toFixed(2)}</strong></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Paper>
                        <Divider sx={{ my: 1 }} />
                      </Box>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* PAYMENTS */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PaymentsIcon sx={{ color: "#2E7D32", fontSize: 28, mr: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Payment History</Typography>
              </Box>

              {payments.length === 0 ? (
                <Typography sx={{ mt: 2 }}>No payments recorded yet.</Typography>
              ) : (
                <List>
                  {payments.map((p) => (
                    <Paper key={p.id} sx={{ p: 1, mb: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>₹{Number(p.amount).toFixed(2)}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(p.payment_date).toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Button size="small" startIcon={<EditIcon />} onClick={() => openPaymentEdit(p)}>Edit</Button>
                          <Button size="small" color="error" onClick={() => deletePayment(p.id)}>Delete</Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ===== SALE EDIT DIALOG ===== */}
      <Dialog open={saleEditOpen} onClose={closeSaleEdit} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Sale
          <IconButton aria-label="close" onClick={closeSaleEdit} sx={{ position: "absolute", right: 8, top: 8 }} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editingSale ? (
            <>
              <Typography variant="subtitle2" color="text.secondary">Sale Date: {new Date(editingSale.sale_date).toLocaleString()}</Typography>

              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Variant ID</TableCell>
                    <TableCell>Variant Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editingSaleItems.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{it.variant}</TableCell>
                      <TableCell>{it.variant_name}</TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={it.quantity} onChange={(e) => updateSaleItem(idx, "quantity", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={it.price_at_sale} onChange={(e) => updateSaleItem(idx, "price_at_sale", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Button color="error" onClick={() => removeSaleItemRow(idx)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={addSaleItemRow}>Add Item Row</Button>
              </Box>
            </>
          ) : <CircularProgress />}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSaleEdit}>Cancel</Button>
          <Button onClick={submitSaleUpdate} variant="contained">Save Sale</Button>
        </DialogActions>
      </Dialog>

      {/* ===== PAYMENT EDIT DIALOG ===== */}
      <Dialog open={paymentEditOpen} onClose={closePaymentEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Payment</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Payment Date (read-only)
          </Typography>
          <TextField fullWidth value={editingPayment?.payment_date ? new Date(editingPayment.payment_date).toLocaleString() : ""} disabled sx={{ mb: 2 }} />

          <TextField label="Amount" type="number" fullWidth value={editingPaymentAmount} onChange={(e) => setEditingPaymentAmount(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentEdit}>Cancel</Button>
          <Button variant="contained" onClick={submitPaymentUpdate}>Save Payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
