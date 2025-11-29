import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Box, Grid, Card, CardContent, Typography, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText,
    IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle // New
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function PurchasesPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [variants, setVariants] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [supplierName, setSupplierName] = useState('');
    const [purchaseData, setPurchaseData] = useState({ supplier: '', variant: '', quantity: '', purchase_price: '' });

    // --- NEW STATE for dialog ---
    const [dialogOpen, setDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // Will hold { id }

    const fetchData = () => {
        axios.get('http://localhost:8000/api/suppliers/').then(res => setSuppliers(res.data));
        axios.get('http://localhost:8000/api/variants/').then(res => setVariants(res.data));
        axios.get('http://localhost:8000/api/purchases/').then(res => setPurchases(res.data.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))));
    };
    useEffect(() => { fetchData(); }, []);
    
    // --- NEW DIALOG HANDLERS ---
    const handleOpenDialog = (id) => {
        setItemToDelete({ id });
        setDialogOpen(true);
    };
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setItemToDelete(null);
    };
    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        axios.delete(`http://localhost:8000/api/purchases/${itemToDelete.id}/`)
            .then(() => {
                toast.success('Purchase record deleted!');
                fetchData();
            })
            .catch(err => {
                toast.error('Failed to delete purchase.');
                console.error(err);
            }).finally(() => {
                handleCloseDialog();
            });
    };

    // ... (other handlers remain) ...
    const getVariantName = (id) => {
        const variant = variants.find(v => v.id === id);
        return variant ? `${variant.product_name} (${variant.name})` : 'Unknown';
    };
    const handleInputChange = (e) => {
        setPurchaseData({ ...purchaseData, [e.target.name]: e.target.value });
    };
    const handleAddSupplier = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8000/api/suppliers/', { name: supplierName })
            .then(() => {
                toast.success('Supplier added!');
                setSupplierName('');
                fetchData();
            });
    };
    const handleRecordPurchase = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8000/api/purchases/', purchaseData)
            .then(() => {
                toast.success('Purchase recorded! Stock updated.');
                setPurchaseData({ supplier: '', variant: '', quantity: '', purchase_price: '' });
                fetchData();
            });
    };


    return (
        <Box>
            <Typography variant="h2" gutterBottom>📥 Suppliers & Purchases</Typography>
            <Grid container spacing={3}>
                {/* ... (Cards for forms remain the same) ... */}
                 <Grid item xs={12} md={6}><Card><CardContent>
                    <Typography variant="h3" gutterBottom>Add New Supplier</Typography>
                    <Box component="form" onSubmit={handleAddSupplier} sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Supplier Name" value={supplierName} onChange={e => setSupplierName(e.target.value)} required fullWidth/>
                        <Button type="submit" variant="contained">Add</Button>
                    </Box>
                </CardContent></Card></Grid>
                <Grid item xs={12} md={6}><Card><CardContent>
                    <Typography variant="h3" gutterBottom>Record New Purchase</Typography>
                    <Box component="form" onSubmit={handleRecordPurchase} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth><InputLabel>Supplier</InputLabel>
                            <Select name="supplier" value={purchaseData.supplier} label="Supplier" onChange={handleInputChange} required>
                                {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth><InputLabel>Product Variant</InputLabel>
                            <Select name="variant" value={purchaseData.variant} label="Product Variant" onChange={handleInputChange} required>
                                {variants.map(v => <MenuItem key={v.id} value={v.id}>{getVariantName(v.id)}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField name="quantity" label="Quantity" type="number" value={purchaseData.quantity} onChange={handleInputChange} required />
                        <TextField name="purchase_price" label="Total Purchase Price" type="number" value={purchaseData.purchase_price} onChange={handleInputChange} required />
                        <Button type="submit" variant="contained">Record Purchase</Button>
                    </Box>
                </CardContent></Card></Grid>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                             <Typography variant="h3" gutterBottom>Purchase History</Typography>
                             <List>
                                {purchases.map(p => (
                                    <ListItem key={p.id}
                                        secondaryAction={
                                            // --- MODIFIED ---
                                            <IconButton edge="end" onClick={() => handleOpenDialog(p.id)}>
                                                <DeleteIcon color="error" />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={`${p.quantity} units of ${getVariantName(p.variant)}`}
                                            secondary={`On ${new Date(p.purchase_date).toLocaleDateString()} for ₹${p.purchase_price}`}
                                        />
                                    </ListItem>
                                ))}
                             </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
             {/* --- NEW CONFIRMATION DIALOG --- */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this purchase record? This action will update the product stock and cannot be undone.
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
export default PurchasesPage;