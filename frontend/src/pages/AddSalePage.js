// frontend/src/pages/AddSalePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const API = "http://localhost:8000/api/";

function AddSalePage() {
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState("");

  const [cart, setCart] = useState([]);

  // Load data
  useEffect(() => {
    axios.get(`${API}customers/all/`)
      .then(res => setCustomers(res.data || []))
      .catch(() => toast.error("Failed to load customers"));

    axios.get(`${API}variants/`)
      .then(res => setVariants(res.data || []))
      .catch(() => toast.error("Failed to load product variants"));
  }, []);

  // Load price automatically when variant selected
  useEffect(() => {
    if (!selectedVariantId) {
      setSelectedPrice("");
      return;
    }
    const v = variants.find(x => x.id === Number(selectedVariantId));
    if (v) setSelectedPrice(v.price);
  }, [selectedVariantId, variants]);

  // Add item to bill
  const addToCart = () => {
    if (!selectedVariantId) return toast.warn("Select a product");
    if (!selectedQty || Number(selectedQty) <= 0) return toast.warn("Quantity must be > 0");
    if (!selectedPrice || Number(selectedPrice) <= 0) return toast.warn("Enter selling price");

    const v = variants.find(x => x.id === Number(selectedVariantId));

    const item = {
      variant: v.id,
      variant_name: `${v.product_name} (${v.name})`,
      quantity: Number(selectedQty),
      price_at_sale: Number(selectedPrice),
    };

    setCart(prev => [...prev, item]);

    // Reset inputs
    setSelectedVariantId("");
    setSelectedQty(1);
    setSelectedPrice("");
  };

  // Update cart line (qty or price)
  const updateLine = (index, field, value) => {
    setCart(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: Number(value) } : item
      )
    );
  };

  // Remove line
  const removeLine = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Submit sale
  const submitSale = async () => {
    if (!selectedCustomerId) return toast.warn("Select a customer");
    if (cart.length === 0) return toast.warn("Add at least one item");

    const payload = {
      customer: Number(selectedCustomerId),
      items: cart.map(item => ({
        variant: item.variant,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale
      }))
    };

    try {
      await axios.post(`${API}sales/`, payload);
      toast.success("Sale recorded successfully!");
      setCart([]);
      setSelectedCustomerId("");

      // reload variants to refresh stock
      const vRes = await axios.get(`${API}variants/`);
      setVariants(vRes.data || []);

    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Failed to record sale.");
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * item.price_at_sale,
    0
  );

  // --------------------- CSV EXPORT ---------------------
  const exportCSV = () => {
    if (!cart.length) return toast.warn("No items to export");

    const customerName =
      customers.find(c => c.id === Number(selectedCustomerId))?.name || "Unknown";

    const rows = [
      ["Customer", customerName],
      ["Date", new Date().toLocaleString()],
      [],
      ["Item", "Qty", "Rate", "Total"],
    ];

    cart.forEach(it => {
      rows.push([
        it.variant_name,
        it.quantity,
        it.price_at_sale,
        (it.quantity * it.price_at_sale).toFixed(2),
      ]);
    });

    rows.push([]);
    rows.push(["TOTAL", "", "", total.toFixed(2)]);

    const csv = rows.map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sale_receipt.csv";
    link.click();
  };

  // --------------------- PRINT RECEIPT ---------------------
  const printReceipt = () => {
    if (!cart.length) return toast.warn("No items to print");

    const customer =
      customers.find(c => c.id === Number(selectedCustomerId)) || {};

    const printWin = window.open("", "_blank");

    printWin.document.write(`
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 8px; width: 250px; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; font-size: 14px; }
          td { padding: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center"><b>GROCERY TRACK</b></div>
        <div class="center">-----------------------------------</div>
        <div><b>Customer:</b> ${customer.name || ""}</div>
        <div><b>Mobile:</b> ${customer.mobile || ""}</div>
        <div><b>Date:</b> ${new Date().toLocaleString()}</div>
        <div class="line"></div>

        <table>
          <tr>
            <th align="left">Item</th>
            <th align="right">Total</th>
          </tr>
          ${cart
            .map(
              (i) => `
            <tr>
              <td>${i.variant_name}<br />
              ${i.quantity} x ₹${i.price_at_sale}</td>
              <td align="right">₹${(i.quantity * i.price_at_sale).toFixed(
                2
              )}</td>
            </tr>`
            )
            .join("")}
        </table>

        <div class="line"></div>
        <div><b>Total: ₹${total.toFixed(2)}</b></div>
        <div class="center">*********************************</div>

        <script>
          window.print();
          window.close();
        </script>
      </body>
      </html>
    `);

    printWin.document.close();
  };

  // --------------------------------------------------------

  return (
    <Box sx={{ maxWidth: "1200px" }}>
      <Card sx={{ p: 1 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            🧾 Add New Sale (POS)
          </Typography>

          <Grid container spacing={3}>
            {/* LEFT SIDE — INPUTS */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  1) Select Customer
                </Typography>

                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    label="Customer"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <MenuItem value="">-- Select Customer --</MenuItem>
                    {customers.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} {c.mobile ? `— ${c.mobile}` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  2) Add Item
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Product Variant</InputLabel>
                  <Select
                    label="Product Variant"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                  >
                    <MenuItem value="">-- Choose Product --</MenuItem>
                    {variants.map(v => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.product_name} — {v.name} — ₹{v.price}  
                        (Stock: {v.current_stock})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Quantity"
                  type="number"
                  inputProps={{ step: 0.1, min: 0 }}
                  fullWidth
                  sx={{ mb: 2 }}
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                />

                <TextField
                  label="Selling Price"
                  type="number"
                  inputProps={{ step: 0.1, min: 0 }}
                  fullWidth
                  sx={{ mb: 2 }}
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />

                <Button
                  variant="contained"
                  onClick={addToCart}
                  fullWidth
                  sx={{
                    mt: 1,
                    backgroundColor: "#1976d2",
                    ":hover": { backgroundColor: "#145ca2" }
                  }}
                >
                  ➕ Add to Bill
                </Button>
              </Box>
            </Grid>

            {/* RIGHT SIDE — BILL */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                3) Current Bill
              </Typography>

              <Table sx={{ border: "1px solid #ddd", borderRadius: "4px" }}>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell><b>Item</b></TableCell>
                    <TableCell><b>Qty</b></TableCell>
                    <TableCell><b>Rate (₹)</b></TableCell>
                    <TableCell><b>Total (₹)</b></TableCell>
                    <TableCell><b>Action</b></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {cart.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.variant_name}</TableCell>

                      <TableCell width="80px">
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ step: 0.1, min: 0 }}
                          value={item.quantity}
                          onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                        />
                      </TableCell>

                      <TableCell width="100px">
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ step: 0.1, min: 0 }}
                          value={item.price_at_sale}
                          onChange={(e) => updateLine(idx, "price_at_sale", e.target.value)}
                        />
                      </TableCell>

                      <TableCell>
                        {(item.quantity * item.price_at_sale).toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <IconButton color="error" onClick={() => removeLine(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* TOTAL SECTION */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 3,
                  p: 2,
                  backgroundColor: "#e3f2fd",
                  borderRadius: "6px",
                  border: "1px solid #bbdefb"
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total: ₹{total.toFixed(2)}
                </Typography>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportCSV}
                    disabled={!cart.length}
                  >
                    CSV
                  </Button>

                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<PrintIcon />}
                    onClick={printReceipt}
                    disabled={!cart.length}
                  >
                    Print
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={submitSale}
                    disabled={!selectedCustomerId || cart.length === 0}
                    sx={{ px: 4, py: 1.2 }}
                  >
                    💾 Submit
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AddSalePage;
