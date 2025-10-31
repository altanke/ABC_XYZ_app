package com.attire.back.service;

import com.attire.back.model.Order;
import com.attire.back.model.OrderItem;
import com.attire.back.model.CartItem;
import com.attire.back.model.User;
import com.attire.back.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartItemService cartItemService;

    @Autowired
    private UserService userService;

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public Optional<Order> findById(Long orderId) {
        return orderRepository.findById(orderId);
    }

    @Transactional
    public Order createOrderFromCart(Long userId) {
        Optional<User> userOptional = userService.findById(userId);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        User user = userOptional.get();

        List<CartItem> cartItems = cartItemService.getCartItemsByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty for user id: " + userId);
        }

        Order order = new Order();
        order.setUser(user);

        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem(
                    order,
                    cartItem.getProduct(),
                    cartItem.getQuantity(),
                    BigDecimal.valueOf(cartItem.getProduct().getPrice()) // Use BigDecimal for price
            );
            order.addOrderItem(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        cartItemService.deleteCartItemsByUserId(userId);

        return savedOrder;
    }
}