import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, CircularProgress, Grid } from '@mui/material';

function CustomerDetailPage() {
  const { customerId } = useParams(); // FIX: Use customerId to match the route
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:8000/api/customer-detail/${customerId}/`) // FIX: Use customerId in the URL
      .then(res => {
        setCustomer(res.data.customer);
        setSales(res.data.sales || []);
        setPayments(res.data.payments || []);
        setBalance(res.data.balance || 0);
      })
      .catch(() => {
        toast.error('❌ Failed to load customer details.');
      })
      .finally(() => setLoading(false));
  }, [customerId]); // FIX: Dependency array should use customerId

  if (loading) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <CircularProgress />
          </Box>
      );
  }
  
  if (!customer) return <Typography>No customer found.</Typography>;

  // FIX: Convert balance to a number before formatting
  const numericBalance = parseFloat(balance);

  return (
    <Box>
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h2" gutterBottom>{customer.name}</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">
                            <strong>Mobile:</strong> {customer.mobile || 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                         <Typography variant="subtitle1">
                            <strong>Address:</strong> {customer.address || 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h5" color={numericBalance > 0 ? 'error.main' : 'success.main'}>
                            <strong>Balance:</strong> ₹{numericBalance.toFixed(2)}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
            <Card>
                <CardContent>
                <Typography variant="h3" gutterBottom>Sales History</Typography>
                {sales.length > 0 ? (
                    <List>
                    {sales.map(sale => (
                        <ListItem key={sale.id} sx={{ borderBottom: '1px solid #eee' }}>
                        <ListItemText
                            primary={`Sale on ${new Date(sale.sale_date).toLocaleDateString()}`}
                            secondary={
                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {sale.items.map((i, index) => (
                                        <Typography component="li" variant="body2" key={index}>
                                            {i.variant_name}: {i.quantity} x ₹{i.price_at_sale} = ₹{(i.quantity * i.price_at_sale).toFixed(2)}
                                        </Typography>
                                    ))}
                                </Box>
                            }
                        />
                        </ListItem>
                    ))}
                    </List>
                ) : <Typography sx={{mt: 2}}>No sales recorded yet.</Typography>}
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
            <Card>
                <CardContent>
                <Typography variant="h3" gutterBottom>Payment History</Typography>
                {payments.length > 0 ? (
                    <List>
                    {payments.map(p => (
                        <ListItem key={p.id} sx={{ borderBottom: '1px solid #eee' }}>
                        <ListItemText
                            primary={`Payment of ₹${p.amount}`}
                            secondary={`Received on: ${new Date(p.payment_date).toLocaleDateString()}`}
                        />
                        </ListItem>
                    ))}
                    </List>
                ) : <Typography sx={{mt: 2}}>No payments recorded yet.</Typography>}
                </CardContent>
            </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CustomerDetailPage;