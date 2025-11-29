// src/pages/PurchasesPage.js

import React, { useEffect, useState } from "react";
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
  IconButton,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";

import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:8000/api/";

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [history, setHistory] = useState([]);

  const [newSupplier, setNewSupplier] = useState("");
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingSupplierName, setEditingSupplierName] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // -------------------------------
  // Load suppliers, variants & history
  // -------------------------------
  useEffect(() => {
    axios.get(`${API_BASE}suppliers/`).then((res) => setSuppliers(res.data || []));
    axios.get(`${API_BASE}variants/`).then((res) => setVariants(res.data || []));
    loadHistory();
  }, []);

  const loadHistory = () => {
    axios
      .get(`${API_BASE}purchases/`)
      .then((res) => setHistory(res.data || []))
      .catch(() => toast.error("Failed to load purchase history"));
  };

  // -------------------------------
  // Add new supplier
  // -------------------------------
  const addSupplier = () => {
    if (!newSupplier.trim()) return toast.warn("Supplier name required");

    axios
      .post(`${API_BASE}suppliers/`, { name: newSupplier })
      .then((res) => {
        setSuppliers((prev) => [...prev, res.data]);
        toast.success("Supplier added");
        setNewSupplier("");
      })
      .catch(() => toast.error("Failed to add supplier"));
  };

  // -------------------------------
  // Edit supplier name
  // -------------------------------
  const saveSupplierEdit = () => {
    if (!editingSupplierName.trim())
      return toast.warn("Supplier name cannot be empty");

    axios
      .patch(`${API_BASE}suppliers/${editingSupplierId}/`, {
        name: editingSupplierName,
      })
      .then((res) => {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingSupplierId ? res.data : s))
        );
        toast.success("Supplier updated");

        setEditingSupplierId(null);
        setEditingSupplierName("");
      })
      .catch(() => toast.error("Failed to update supplier"));
  };

  // -------------------------------
  // Record new purchase
  // -------------------------------
  const recordPurchase = () => {
    if (!supplierId || !variantId || !quantity || !price)
      return toast.warn("All fields required");

    const payload = {
      supplier: supplierId,
      variant: variantId,
      quantity: Number(quantity),
      purchase_price: Number(price),
    };

    axios
      .post(`${API_BASE}purchases/`, payload)
      .then(() => {
        toast.success("Purchase recorded");
        setSupplierId("");
        setVariantId("");
        setQuantity("");
        setPrice("");
        loadHistory();
      })
      .catch(() => toast.error("Failed to record purchase"));
  };

  // -------------------------------
  // Delete purchase
  // -------------------------------
  const deletePurchase = (id) => {
    if (!window.confirm("Delete this purchase record?")) return;

    axios
      .delete(`${API_BASE}purchases/${id}/`)
      .then(() => {
        toast.success("Purchase deleted");
        loadHistory();
      })
      .catch(() => toast.error("Failed to delete purchase"));
  };

  // -------------------------------
  // FILTERED HISTORY
  // -------------------------------
  const filteredHistory = history.filter((item) =>
    `${item.variant_name} ${item.supplier_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ---------------------------------------------------
  // UI Layout
  // ---------------------------------------------------
  return (
    <Box sx={{ width: "100%", pr: 4, pl: 3 }}>
      {/* TITLE */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <LocalShippingIcon sx={{ fontSize: 34, mr: 1.2, color: "#6A1B9A" }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Suppliers & Purchases
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ---------------- Add Supplier ---------------- */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Add New Supplier
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Supplier Name *"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                />
                <Button variant="contained" sx={{ width: 120 }} onClick={addSupplier}>
                  Add
                </Button>
              </Box>

              {/* Supplier List */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Supplier List
                </Typography>

                {suppliers.map((s) => (
                  <Box
                    key={s.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                    }}
                  >
                    {editingSupplierId === s.id ? (
                      <>
                        <TextField
                          size="small"
                          value={editingSupplierName}
                          onChange={(e) => setEditingSupplierName(e.target.value)}
                        />
                        <Button size="small" onClick={saveSupplierEdit}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography>{s.name}</Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingSupplierId(s.id);
                              setEditingSupplierName(s.name);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ---------------- Record Purchase ---------------- */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Record New Purchase
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Supplier</InputLabel>
                <Select
                  label="Supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  {suppliers.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Product Variant</InputLabel>
                <Select
                  label="Product Variant"
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                >
                  {variants.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.product_name} ({v.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Quantity *"
                fullWidth
                sx={{ mb: 2 }}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <TextField
                label="Total Purchase Price *"
                fullWidth
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={recordPurchase}>
                Record Purchase
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* ---------------- Purchase History ---------------- */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <SearchIcon sx={{ mr: 1 }} />
                <TextField
                  placeholder="Search purchases by supplier, item..."
                  fullWidth
                  variant="standard"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Purchase History
              </Typography>

              {filteredHistory.length === 0 ? (
                <Typography sx={{ py: 3, color: "text.secondary" }}>
                  No purchases found.
                </Typography>
              ) : (
                filteredHistory.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1.4,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {item.quantity} units of {item.variant_name}
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        Supplier: {item.supplier_name} <br />
                        On {new Date(item.purchase_date).toLocaleDateString()} for ₹
                        {Number(item.purchase_price).toFixed(2)}
                      </Typography>
                    </Box>

                    <IconButton color="error" onClick={() => deletePurchase(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
