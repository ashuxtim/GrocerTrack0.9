import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Modal,
  IconButton,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";

import EmptyState from "../components/EmptyState";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 3,
};

const initialNewProductState = {
  productName: "",
  variantName: "",
  price: "",
  unit: "piece",
  current_stock: 0,
};

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [editingVariant, setEditingVariant] = useState(null);
  const [editVariantData, setEditVariantData] = useState({
    price: "",
    current_stock: "",
  });
  const [newProductData, setNewProductData] = useState(initialNewProductState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchProducts = () => {
    axios
      .get("http://localhost:8000/api/products/")
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("Failed to load products."));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const rows = useMemo(
    () =>
      products.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          productName: product.name,
          variantName: variant.name,
          price: variant.price,
          currentStock: variant.current_stock,
          unit: variant.unit,
          fullVariant: variant,
        }))
      ),
    [products]
  );

  const handleOpenDialog = (id, type, name) => {
    setItemToDelete({ id, type, name });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const { id, type, name } = itemToDelete;

    const url =
      type === "product"
        ? `http://localhost:8000/api/products/${id}/`
        : `http://localhost:8000/api/variants/${id}/`;

    axios
      .delete(url)
      .then(() => {
        toast.success(
          `${type === "product" ? "Product" : "Variant"} "${name}" deleted`
        );
        fetchProducts();
      })
      .catch(() =>
        toast.error(`Failed to delete ${type}. It may have sale records.`)
      )
      .finally(() => handleCloseDialog());
  };

  const handleNewProductChange = (e) => {
    setNewProductData({
      ...newProductData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddProductAndVariant = (e) => {
    e.preventDefault();

    const existingProduct = products.find(
      (p) =>
        p.name.toLowerCase() === newProductData.productName.toLowerCase().trim()
    );

    const productPromise = existingProduct
      ? Promise.resolve({ data: existingProduct })
      : axios.post("http://localhost:8000/api/products/", {
          name: newProductData.productName,
        });

    productPromise
      .then((response) => {
        const productId = response.data.id;

        const variantPayload = {
          product: productId,
          name: newProductData.variantName,
          price: newProductData.price,
          unit: newProductData.unit,
          current_stock: newProductData.current_stock,
        };

        return axios.post("http://localhost:8000/api/variants/", variantPayload);
      })
      .then(() => {
        toast.success(`Product "${newProductData.productName}" added`);
        setNewProductData(initialNewProductState);
        fetchProducts();
      })
      .catch(() => toast.error("Failed to add product"));
  };

  const handleEditClick = (row) => {
    setEditingVariant(row.fullVariant);
    setEditVariantData({
      price: row.price,
      current_stock: row.currentStock,
    });
  };

  const handleUpdateVariant = (e) => {
    e.preventDefault();
    axios
      .put(
        `http://localhost:8000/api/variants/${editingVariant.id}/`,
        editVariantData
      )
      .then(() => {
        toast.success(`${editingVariant.name} updated`);
        setEditingVariant(null);
        fetchProducts();
      })
      .catch(() => toast.error("Failed to update variant"));
  };

  const productOptions = useMemo(
    () => products.map((p) => ({ label: p.name })),
    [products]
  );

  const columns = [
    { field: "productName", headerName: "Product", flex: 1 },
    { field: "variantName", headerName: "Variant", flex: 1 },
    { field: "price", headerName: "Price (₹)", flex: 0.6 },
    { field: "currentStock", headerName: "Stock", flex: 0.6 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      renderCell: (params) => {
        const stock = params.row.currentStock;
        if (stock <= 0) return <Chip label="Out of Stock" color="error" />;
        if (stock <= 10) return <Chip label="Low Stock" color="warning" />;
        return <Chip label="In Stock" color="success" />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.6,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() =>
              handleOpenDialog(params.id, "variant", params.row.variantName)
            }
          >
            <DeleteIcon color="error" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ pl: 3, pr: 4, width: "100%" }}>
      {/* PAGE TITLE */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <InventoryIcon sx={{ fontSize: 36, mr: 1.2, color: "#0288D1" }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Product Inventory
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* -------------------- LEFT AREA -------------------- */}
        <Grid item xs={12} md={8}>
          {/* Add New Product */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Add New Product & Variant
              </Typography>

              <Box component="form" onSubmit={handleAddProductAndVariant}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      freeSolo
                      options={productOptions}
                      value={newProductData.productName}
                      onInputChange={(e, v) =>
                        setNewProductData({ ...newProductData, productName: v })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Product Name"
                          required
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Variant Name"
                      name="variantName"
                      required
                      fullWidth
                      value={newProductData.variantName}
                      onChange={handleNewProductChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Price (₹)"
                      name="price"
                      type="number"
                      required
                      fullWidth
                      value={newProductData.price}
                      onChange={handleNewProductChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        name="unit"
                        value={newProductData.unit}
                        label="Unit"
                        onChange={handleNewProductChange}
                      >
                        <MenuItem value="piece">Piece</MenuItem>
                        <MenuItem value="kg">Kilogram</MenuItem>
                        <MenuItem value="packet">Packet</MenuItem>
                        <MenuItem value="litre">Litre</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Initial Stock"
                      name="current_stock"
                      type="number"
                      required
                      fullWidth
                      value={newProductData.current_stock}
                      onChange={handleNewProductChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                    >
                      Add Product
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* Product Table */}
          <Card>
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={rows}
                columns={columns}
                disableRowSelectionOnClick
                slots={{
                  noRowsOverlay: () => (
                    <EmptyState
                      title="No Products"
                      message="Add a product to get started."
                    />
                  ),
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* -------------------- RIGHT AREA -------------------- */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Product Categories
              </Typography>

              {products.length ? (
                <List>
                  {products.map((product) => (
                    <ListItem
                      key={product.id}
                      secondaryAction={
                        <IconButton
                          onClick={() =>
                            handleOpenDialog(product.id, "product", product.name)
                          }
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={product.name}
                        secondary={`${product.variants.length} variants`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ textAlign: "center", py: 2 }}>
                  No product categories yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* EDIT VARIANT MODAL */}
      <Modal open={!!editingVariant} onClose={() => setEditingVariant(null)}>
        <Box sx={modalStyle} component="form" onSubmit={handleUpdateVariant}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit {editingVariant?.name}
          </Typography>

          <TextField
            label="Price"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={editVariantData.price}
            onChange={(e) =>
              setEditVariantData({
                ...editVariantData,
                price: e.target.value,
              })
            }
          />

          <TextField
            label="Current Stock"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={editVariantData.current_stock}
            onChange={(e) =>
              setEditVariantData({
                ...editVariantData,
                current_stock: e.target.value,
              })
            }
          />

          <Button type="submit" variant="contained" fullWidth>
            Save Changes
          </Button>
        </Box>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Delete?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{itemToDelete?.name}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
