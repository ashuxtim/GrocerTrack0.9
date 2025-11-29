import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Box, Grid, Card, CardContent, Typography, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, Divider,
    Autocomplete
} from '@mui/material';

function AddSalePage() {
    const [customers, setCustomers] = useState([]);
    const [variants, setVariants] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [cart, setCart] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        axios.get('http://localhost:8000/api/customers/').then(res => setCustomers(res.data.results || []));
        axios.get('http://localhost:8000/api/variants/').then(res => setVariants(res.data || []));
    }, []);

    const handleAddToCart = () => {
        const variant = variants.find(v => v.id === parseInt(selectedVariant));
        if (variant && quantity > 0) {
            const cartItem = {
                variant: variant.id,
                variant_name: `${variant.product_name} (${variant.name})`,
                quantity: parseFloat(quantity),
                price_at_sale: variant.price
            };
            setCart([...cart, cartItem]);
            setSelectedVariant('');
            setQuantity(1);
        } else {
            toast.warn('Please select a valid product and quantity.');
        }
    };

    const handleSubmitSale = () => {
        if (!selectedCustomer || cart.length === 0) {
            toast.error('Please select a customer and add items to the bill.');
            return;
        }
        const saleData = {
            customer: selectedCustomer.id,
            items: cart.map(({ variant, quantity, price_at_sale }) => ({ variant, quantity, price_at_sale }))
        };
        axios.post('http://localhost:8000/api/sales/', saleData)
            .then(() => {
                toast.success('Sale recorded successfully!');
                setCart([]);
                setSelectedCustomer(null);
            })
            .catch(error => {
                console.error('Error recording sale:', error.response?.data || error);
                toast.error('Failed to record sale.');
            });
    };

    const totalBill = cart.reduce((total, item) => total + (item.quantity * item.price_at_sale), 0);

    return (
        <Card>
            <CardContent>
                <Typography variant="h2" gutterBottom>📝 Add New Credit Sale</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Typography variant="h3" gutterBottom>1. Add Items to Bill</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2}}>
                            <Autocomplete
                                options={customers}
                                getOptionLabel={(option) => option.name}
                                value={selectedCustomer}
                                onChange={(event, newValue) => {
                                    setSelectedCustomer(newValue);
                                }}
                                renderInput={(params) => <TextField {...params} label="Search for a Customer" required />}
                            />
                            <Divider sx={{ my: 1 }}/>
                             <FormControl fullWidth>
                                <InputLabel>Product</InputLabel>
                                <Select value={selectedVariant} label="Product" onChange={e => setSelectedVariant(e.target.value)}>
                                     {variants.map(v => <MenuItem key={v.id} value={v.id}>{v.product_name} ({v.name})</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="Quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="0.1" step="0.1" />
                            <Button variant="outlined" onClick={handleAddToCart}>Add to Bill</Button>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Typography variant="h3" gutterBottom>2. Current Bill</Typography>
                        <List>
                            {cart.map((item, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={item.variant_name}
                                        secondary={`Qty: ${item.quantity} @ ₹${item.price_at_sale}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                        <Divider />
                        <Typography variant="h5" align="right" sx={{ mt: 2, mr: 2 }}>
                            Total: ₹{totalBill.toFixed(2)}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={handleSubmitSale}
                            disabled={!selectedCustomer || cart.length === 0}
                        >
                            Submit Sale
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
export default AddSalePage;