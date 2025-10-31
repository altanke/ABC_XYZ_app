// Файл: OrderController.java
package com.attire.back.controller;

import com.attire.back.dto.OrderItemDto;
import com.attire.back.dto.OrderResponse;
import com.attire.back.dto.ProductDto;
import com.attire.back.model.Order;
import com.attire.back.model.Product; // Импортируем Product
import com.attire.back.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// Импортируем ServletUriComponentsBuilder
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByUserId(@PathVariable Long userId) {
        List<Order> orders = orderService.getOrdersByUserId(userId);
        List<OrderResponse> responses = orders.stream()
                .map(this::mapOrderToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        Optional<Order> orderOptional = orderService.findById(orderId);
        return orderOptional.map(order -> ResponseEntity.ok(mapOrderToResponse(order)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }


    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createOrder(@PathVariable Long userId) {
        try {
            Order savedOrder = orderService.createOrderFromCart(userId);
            OrderResponse response = mapOrderToResponse(savedOrder);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private OrderResponse mapOrderToResponse(Order order) {
        List<OrderItemDto> itemDtos = order.getOrderItems().stream()
                .map(item -> {
                    // --- НАЧАЛО ИСПРАВЛЕНИЯ ---
                    Product product = item.getProduct();
                    String imageUrl = null;
                    if (product.getImageFileName() != null && !product.getImageFileName().isBlank()) {
                        imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                                .path("/api/files/images/")
                                .path(product.getImageFileName())
                                .toUriString();
                    }

                    ProductDto productDto = new ProductDto(
                            product.getId(),
                            product.getName(),
                            product.getPrice(), // Текущая цена
                            product.getDescription(),
                            product.getCategory(),
                            imageUrl // Используем новый URL
                    );
                    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

                    return new OrderItemDto(
                            item.getId(),
                            productDto, // Передаем созданный DTO
                            item.getQuantity(),
                            item.getPriceAtPurchase()
                    );
                })
                .collect(Collectors.toList());

        BigDecimal totalPrice = itemDtos.stream()
                .map(item -> item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderResponse(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getUsername(),
                order.getOrderDate(),
                itemDtos,
                totalPrice
        );
    }
}