package com.attire.back.service;

import com.attire.back.model.Order;
import com.attire.back.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }
}
