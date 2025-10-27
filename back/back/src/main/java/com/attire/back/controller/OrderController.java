package com.attire.back.controller;

import com.attire.back.dto.OrderResponse;
import com.attire.back.model.CartItem;
import com.attire.back.model.Order;
import com.attire.back.service.CartItemService;
import com.attire.back.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartItemService cartItemService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable Long userId) {
        List<Order> orders = orderService.getOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{userId}")
    public ResponseEntity<OrderResponse> createOrder(@PathVariable Long userId) {
        // Получаем товары в корзине
        List<CartItem> cartItems = cartItemService.getCartItemsByUserId(userId);

        if (cartItems.isEmpty()) {
            return ResponseEntity.badRequest().body(null); // Корзина пуста
        }

        // Рассчитываем общую стоимость
        double totalPrice = cartItems.stream()
                .mapToDouble(item -> item.getProduct().getPrice() * item.getQuantity())
                .sum();

        // Создаем заказ
        Order order = new Order();
        order.setUser(cartItems.get(0).getUser());
        order.setTotalPrice(totalPrice);

        // Сохраняем заказ
        Order savedOrder = orderService.saveOrder(order);

        // Удаляем товары из корзины
        cartItemService.deleteCartItemsByUserId(userId);

        // Формируем ответ
        OrderResponse response = new OrderResponse(
                savedOrder.getId(),
                savedOrder.getUser().getId(),
                savedOrder.getTotalPrice()
        );

        return ResponseEntity.ok(response);
    }
}
