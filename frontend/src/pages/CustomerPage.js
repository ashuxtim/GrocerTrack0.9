import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

const PAGE_SIZE = 10;

function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [allCustomersForDropdown, setAllCustomersForDropdown] = useState([]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [paymentCustomer, setPaymentCustomer] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchPaginatedCustomers = useCallback(() => {
    axios.get(`http://localhost:8000/api/customers/?page=${page}`)
      .then(res => {
        setCustomers(res.data.results || []);
        setCount(res.data.count || 0);
      })
      .catch(() => {
        toast.error('❌ Failed to fetch customer list.');
      });
  }, [page]);

  const fetchAllCustomers = useCallback(() => {
    axios.get('http://localhost:8000/api/customers/all/')
      .then(res => setAllCustomersForDropdown(res.data || []))
      .catch(() => console.warn('Failed to load customers for dropdown'));
  }, []);

  useEffect(() => {
    fetchPaginatedCustomers();
    fetchAllCustomers();
  }, [fetchPaginatedCustomers, fetchAllCustomers]);

  const handleAddCustomer = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/api/customers/', { name, mobile })
      .then(() => {
        toast.success('🎉 Customer added successfully!');
        setName(''); setMobile('');
        fetchPaginatedCustomers();
        fetchAllCustomers();
      })
      .catch(err => {
        if (err.response?.data?.name) {
          toast.warn('⚠️ Customer with this name already exists.');
        } else {
          toast.error('❌ Failed to add customer.');
        }
      });
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!paymentCustomer || !paymentAmount) {
      toast.warn('⚠️ Please select a customer and enter an amount.');
      return;
    }
    axios.post('http://localhost:8000/api/payments/', { customer: paymentCustomer, amount: paymentAmount })
      .then(() => {
        toast.success('💰 Payment recorded successfully!');
        setPaymentCustomer(''); setPaymentAmount('');
      })
      .catch(() => toast.error('❌ Failed to record payment.'));
  };

  const handleOpenDialog = (id, name) => {
    setItemToDelete({ id, name });
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    axios.delete(`http://localhost:8000/api/customers/${itemToDelete.id}/`)
      .then(() => {
        toast.success(`🗑️ Customer "${itemToDelete.name}" deleted successfully!`);
        fetchPaginatedCustomers();
        fetchAllCustomers();
      })
      .catch(() => toast.error('❌ Failed to delete customer. They may have existing sales records.'))
      .finally(() => setDialogOpen(false));
  };

  const handlePageChange = (event, value) => setPage(value);

  return (
    <Box>
      <Typography variant="h2" gutterBottom>👥 Customers</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>Add New Customer</Typography>
              <Box component="form" onSubmit={handleAddCustomer} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                <TextField label="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} />
                <Button type="submit" variant="contained">Add Customer</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>Record Payment</Typography>
              <Box component="form" onSubmit={handleAddPayment} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Customer</InputLabel>
                  <Select value={paymentCustomer} onChange={e => setPaymentCustomer(e.target.value)} required>
                    {allCustomersForDropdown.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Amount Paid" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
                <Button type="submit" variant="contained">Record Payment</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>All Customers</Typography>
              {customers.length ? (
                <List>
                  {customers.map(c => (
                    <ListItem key={c.id} disablePadding
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleOpenDialog(c.id, c.name)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      }>
                      <ListItemButton component={Link} to={`/customer/${c.id}`}>
                        <ListItemText primary={c.name} secondary={c.mobile} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No customers to display.</Typography>
              )}
            </CardContent>
            {count > PAGE_SIZE && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination count={Math.ceil(count / PAGE_SIZE)} page={page} onChange={handlePageChange} color="primary" />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete customer "<strong>{itemToDelete?.name}</strong>"? This will delete all related sales and payments and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerPage;