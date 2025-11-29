import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import theme from './theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CssBaseline,
    ThemeProvider,
    InputBase,
    alpha,
    CircularProgress
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import './App.css';

// Lazy pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CustomerPage = lazy(() => import('./pages/CustomerPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const AddSalePage = lazy(() => import('./pages/AddSalePage'));
const PurchasesPage = lazy(() => import('./pages/PurchasesPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));

const drawerWidth = 240;

const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Add Sale', path: '/sales', icon: <AddShoppingCartIcon /> },
    { text: 'Customers', path: '/customers', icon: <PeopleIcon /> },
    { text: 'Purchases', path: '/purchases', icon: <LocalShippingIcon /> },
    { text: 'Products', path: '/products', icon: <InventoryIcon /> }
];

const SearchBar = ({ searchTerm, onSearchChange }) => {
    const navigate = useNavigate();

    const handleChange = (event) => {
        const term = event.target.value;
        onSearchChange(term);
        if (term) navigate('/search');
        else navigate('/');
    };

    return (
        <Box
            sx={{
                position: 'relative',
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.common.black, 0.06),
                '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.12) },
                width: '100%',
                maxWidth: 350
            }}
        >
            <Box
                sx={{
                    padding: theme.spacing(0, 2),
                    height: '100%',
                    position: 'absolute',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <SearchIcon />
            </Box>

            <InputBase
                placeholder="Search…"
                value={searchTerm}
                onChange={handleChange}
                sx={{
                    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                    width: '100%'
                }}
            />
        </Box>
    );
};

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/products/all/')
            .then(res => setAllProducts(res.data || []))
            .catch(() => {});

        axios.get('http://localhost:8000/api/customers/all/')
            .then(res => setAllCustomers(res.data || []))
            .catch(() => {});
    }, []);

    const filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCustomers = allCustomers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ThemeProvider theme={theme}>
            <Router>
                <Box sx={{ display: 'flex' }}>
                    <CssBaseline />

                    {/* TOP BAR */}
                    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
                        <Toolbar sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="h6">GrocerTrack</Typography>
                            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                        </Toolbar>
                    </AppBar>

                    {/* DRAWER */}
                    <Drawer
                        variant="permanent"
                        sx={{
                            width: drawerWidth,
                            flexShrink: 0,
                            '& .MuiDrawer-paper': {
                                width: drawerWidth,
                                backgroundColor: 'neutral.dark',
                                color: 'white',
                                boxSizing: 'border-box'
                            }
                        }}
                    >
                        <Toolbar />
                        <List>
                            {navItems.map((item) => (
                                <ListItem key={item.text} disablePadding>
                                    <ListItemButton
                                        component={NavLink}
                                        to={item.path}
                                        sx={{
                                            '&.active': {
                                                backgroundColor: 'rgba(255,255,255,0.12)'
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: 'inherit' }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={item.text} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Drawer>

                    {/* FULL WIDTH CONTENT */}
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            padding: 3,
                            paddingTop: 10, // space under top bar
                            width: `calc(100% - ${drawerWidth}px)`
                        }}
                    >
                        <Suspense
                            fallback={
                                <Box sx={{ textAlign: 'center', mt: 5 }}>
                                    <CircularProgress />
                                </Box>
                            }
                        >
                            <Routes>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/sales" element={<AddSalePage />} />
                                <Route path="/customers" element={<CustomerPage />} />
                                <Route path="/customer/:customerId" element={<CustomerDetailPage />} />
                                <Route path="/purchases" element={<PurchasesPage />} />
                                <Route path="/products" element={<ProductPage />} />
                                <Route path="/search" element={<SearchResultsPage
                                    filteredProducts={filteredProducts}
                                    filteredCustomers={filteredCustomers}
                                />} />
                            </Routes>
                        </Suspense>

                        <ToastContainer position="top-right" autoClose={2000} />
                    </Box>
                </Box>
            </Router>
        </ThemeProvider>
    );
}

export default App;
