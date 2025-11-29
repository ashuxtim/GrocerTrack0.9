import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Grid, Card, CardContent, Typography, List, ListItem, ListItemText, 
    CircularProgress, Chip 
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

// We'll simulate chart data for now as our backend doesn't provide time-series sales
const mockSalesData = [
    { date: 'Jan', sales: 2000 }, { date: 'Feb', sales: 2200 }, { date: 'Mar', sales: 2500 },
    { date: 'Apr', sales: 2300 }, { date: 'May', sales: 2800 }, { date: 'Jun', sales: 3000 },
];

function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/api/dashboard/')
            .then(response => {
                setStats(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching dashboard stats:", err);
                setError("Failed to load dashboard data.");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !stats) {
        return (
            <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
                <Typography variant="h6">{error || "Failed to load dashboard data."}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h2" gutterBottom>📊 Dashboard</Typography>
            <Grid container spacing={3}>
                {/* Section 1: Key Metrics */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
                        <AttachMoneyIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                            <Typography variant="subtitle1" color="text.secondary">Total Outstanding Credit</Typography>
                            <Typography variant="h5">₹{stats.total_outstanding_credit.toFixed(2)}</Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
                        <Inventory2OutlinedIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                            <Typography variant="subtitle1" color="text.secondary">Total Product Variants</Typography>
                            <Typography variant="h5">{stats.total_product_variants}</Typography>
                        </Box>
                    </Card>
                </Grid>
                 <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
                        <PeopleOutlineIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                            <Typography variant="subtitle1" color="text.secondary">Total Customers</Typography>
                            <Typography variant="h5">{stats.total_customers}</Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
                        <ShoppingCartOutlinedIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                            <Typography variant="subtitle1" color="text.secondary">Total Sales (Month)</Typography>
                            <Typography variant="h5">₹{mockSalesData[mockSalesData.length - 1].sales}</Typography>
                            {/* Note: This is mock data; real data needs to come from backend */}
                        </Box>
                    </Card>
                </Grid>

                {/* Section 2: Sales Trend Chart (Mock Data) */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h3" gutterBottom>Recent Sales Trend</Typography>
                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="h4" color="text.secondary">
                                    Graph Placeholder <TrendingUpIcon sx={{ fontSize: 30, verticalAlign: 'middle' }} />
                                </Typography>
                                {/* In a real app, you'd integrate a charting library here */}
                                {/* e.g., <LineChart data={mockSalesData} /> */}
                            </Box>
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                This is a placeholder for a sales trend graph.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Section 3: Low Stock Items */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h3" gutterBottom>Low Stock Items</Typography>
                            {stats.low_stock_items && stats.low_stock_items.length > 0 ? (
                                <List dense>
                                    {stats.low_stock_items.map(item => (
                                        <ListItem key={item.id} divider>
                                            <ListItemText 
                                                primary={`${item.product_name} (${item.name})`} 
                                                secondary={`Current Stock: ${item.current_stock}`} 
                                            />
                                            <Chip label="Low" color="warning" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography color="text.secondary" sx={{ mt: 2 }}>No items are currently low in stock.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Section 4: Top Customers by Credit */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h3" gutterBottom>Top Customers by Credit</Typography>
                            {stats.top_customers_by_credit && stats.top_customers_by_credit.length > 0 ? (
                                <List dense>
                                    {stats.top_customers_by_credit.map((customer, index) => (
                                        <ListItem key={index} divider>
                                            <ListItemText primary={customer.name} />
                                            <Chip label={`₹${customer.balance.toFixed(2)}`} color="error" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography color="text.secondary" sx={{ mt: 2 }}>No customers with outstanding credit.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DashboardPage;