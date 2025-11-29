import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

import {
  Box, Button, TextField, Typography, Card, CardContent, Modal, IconButton,
  Autocomplete, Grid, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText,
  Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmptyState from '../components/EmptyState';

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400,
  bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2,
};

const initialNewProductState = {
  productName: '', variantName: '', price: '', unit: 'piece', current_stock: 0,
};

function ProductPage() {
  const [products, setProducts] = useState([]);
  const [editingVariant, setEditingVariant] = useState(null);
  const [editVariantData, setEditVariantData] = useState({ price: '', current_stock: '' });
  const [newProductData, setNewProductData] = useState(initialNewProductState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchProducts = () => {
    axios.get('http://localhost:8000/api/products/')
      .then(res => setProducts(res.data))
      .catch(() => toast.error('Failed to load products.'));
  };

  useEffect(() => { fetchProducts(); }, []);

  const rows = useMemo(() => products.flatMap(product =>
    product.variants.map(variant => ({
      id: variant.id, productName: product.name, variantName: variant.name,
      price: variant.price, currentStock: variant.current_stock, unit: variant.unit,
      fullVariant: variant
    }))
  ), [products]);

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

    let deletePromise;
    if (type === 'product') {
      deletePromise = axios.delete(`http://localhost:8000/api/products/${id}/`);
    } else {
      deletePromise = axios.delete(`http://localhost:8000/api/variants/${id}/`);
    }

    deletePromise
      .then(() => {
        toast.success(`${type === 'product' ? 'Product' : 'Variant'} "${name}" deleted successfully!`);
        fetchProducts();
      })
      .catch(() => {
        toast.error(`Failed to delete ${type}. It may be linked to a sale record.`);
      })
      .finally(() => handleCloseDialog());
  };

  const handleNewProductChange = (e) => {
    setNewProductData({ ...newProductData, [e.target.name]: e.target.value });
  };

  const handleAddProductAndVariant = (e) => {
    e.preventDefault();

    const existingProduct = products.find(
      p => p.name.toLowerCase() === newProductData.productName.toLowerCase()
    );

    let productPromise;
    if (existingProduct) {
      productPromise = Promise.resolve({ data: existingProduct });
    } else {
      productPromise = axios.post('http://localhost:8000/api/products/', { name: newProductData.productName });
    }

    productPromise
      .then(response => {
        const productId = response.data.id;
        const variantPayload = {
          product: productId,
          name: newProductData.variantName,
          price: newProductData.price,
          unit: newProductData.unit,
          current_stock: newProductData.current_stock
        };
        return axios.post('http://localhost:8000/api/variants/', variantPayload);
      })
      .then(() => {
        toast.success(`✅ Product "${newProductData.productName}" added successfully!`);
        setNewProductData(initialNewProductState);
        fetchProducts();
      })
      .catch(err => {
        toast.error('❌ Failed to add product.');
        console.error(err);
      });
  };

  const handleEditClick = (row) => {
    setEditingVariant(row.fullVariant);
    setEditVariantData({ price: row.price, current_stock: row.currentStock });
  };

  const handleUpdateVariant = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...editingVariant, ...editVariantData };
      await axios.put(`http://localhost:8000/api/variants/${editingVariant.id}/`, updatedData);
      toast.success(`✅ ${editingVariant.name} updated successfully!`);
      setEditingVariant(null);
      fetchProducts();
    } catch (err) {
      toast.error('❌ Failed to update variant.');
      console.error(err);
    }
  };

  const columns = [
    { field: 'productName', headerName: 'Product', flex: 1 },
    { field: 'variantName', headerName: 'Variant', flex: 1 },
    { field: 'price', headerName: 'Price (₹)', type: 'number', flex: 0.5 },
    { field: 'currentStock', headerName: 'Stock', type: 'number', flex: 0.5 },
    {
      field: 'status', headerName: 'Status', flex: 0.7,
      renderCell: (params) => {
        const stock = params.row.currentStock;
        let label, color;
        if (stock <= 0) { label = 'Out of Stock'; color = 'error';
        } else if (stock <= 10) { label = 'Low Stock'; color = 'warning';
        } else { label = 'In Stock'; color = 'success'; }
        return <Chip label={label} color={color} size="small" />;
      }
    },
    {
      field: 'actions', headerName: 'Actions', type: 'actions', flex: 0.5,
      getActions: (params) => [
        <IconButton onClick={() => handleEditClick(params.row)}><EditIcon /></IconButton>,
        <IconButton onClick={() => handleOpenDialog(params.id, 'variant', params.row.variantName)}><DeleteIcon color="error" /></IconButton>,
      ]
    }
  ];

  const productOptions = useMemo(() => products.map(p => ({ label: p.name })), [products]);

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h2" gutterBottom>📦 Product Inventory</Typography>

          {/* ADD NEW PRODUCT */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom>Add New Product</Typography>
              <Box component="form" onSubmit={handleAddProductAndVariant}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12}>
                    <Autocomplete
                      freeSolo
                      options={productOptions}
                      value={newProductData.productName}
                      onInputChange={(event, newInputValue) => {
                        setNewProductData({ ...newProductData, productName: newInputValue });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Product Name (Select existing or type a new one)" required />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="variantName" label="Variant Name" value={newProductData.variantName} onChange={handleNewProductChange} required fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="price" label="Price" type="number" value={newProductData.price} onChange={handleNewProductChange} required fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select name="unit" value={newProductData.unit} label="Unit" onChange={handleNewProductChange}>
                        <MenuItem value="piece">Piece</MenuItem>
                        <MenuItem value="kg">Kilogram</MenuItem>
                        <MenuItem value="packet">Packet</MenuItem>
                        <MenuItem value="litre">Litre</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField name="current_stock" label="Initial Stock" type="number" value={newProductData.current_stock} onChange={handleNewProductChange} required fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button type="submit" variant="contained" fullWidth size="large">Add Product</Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* PRODUCT TABLE */}
          <Card>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                slots={{
                  noRowsOverlay: () => <EmptyState title="No Products" message="Get started by adding a new product." />,
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* CATEGORY LIST */}
        <Grid item xs={12} md={4}>
          <Typography variant="h2" gutterBottom sx={{ color: 'transparent', userSelect: 'none' }}>.</Typography>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>Manage Categories</Typography>
              {products.length > 0 ? (
                <List>
                  {products.map((product) => (
                    <ListItem
                      key={product.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleOpenDialog(product.id, 'product', product.name)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={product.name} secondary={`${product.variants.length} variant(s)`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
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
          <Typography variant="h6" component="h2" gutterBottom>Edit {editingVariant?.name}</Typography>
          <TextField label="Price" type="number" value={editVariantData.price} onChange={e => setEditVariantData({...editVariantData, price: e.target.value})} fullWidth sx={{ mb: 2 }} />
          <TextField label="Current Stock" type="number" value={editVariantData.current_stock} onChange={e => setEditVariantData({...editVariantData, current_stock: e.target.value})} fullWidth sx={{ mb: 2 }} />
          <Button type="submit" variant="contained">Save Changes</Button>
        </Box>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the {itemToDelete?.type} "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProductPage;