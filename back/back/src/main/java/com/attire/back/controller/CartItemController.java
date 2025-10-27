package com.attire.back.controller;

import com.attire.back.dto.CartItemResponse;
import com.attire.back.dto.ProductDto;
import com.attire.back.dto.UserDto;
import com.attire.back.model.CartItem;
import com.attire.back.model.Product;
import com.attire.back.model.User;
import com.attire.back.service.CartItemService;
import com.attire.back.service.ProductService;
import com.attire.back.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
public class CartItemController {

    @Autowired
    private CartItemService cartItemService;

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    @PostMapping
    public ResponseEntity<CartItemResponse> addToCart(@RequestBody CartItem cartItem) {
        if (cartItem.getUser() == null || cartItem.getUser().getId() == null) {
            return ResponseEntity.badRequest().body(null);
        }

        if (cartItem.getProduct() == null || cartItem.getProduct().getId() == null) {
            return ResponseEntity.badRequest().body(null);
        }

        Optional<User> user = userService.findById(cartItem.getUser().getId());
        Optional<Product> product = productService.findById(cartItem.getProduct().getId());

        if (user.isEmpty() || product.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        Optional<CartItem> existingCartItem = cartItemService.findByUserIdAndProductId(
                cartItem.getUser().getId(),
                cartItem.getProduct().getId()
        );

        if (existingCartItem.isPresent()) {
            CartItem updatedCartItem = existingCartItem.get();
            updatedCartItem.setQuantity(updatedCartItem.getQuantity() + cartItem.getQuantity());
            CartItem savedCartItem = cartItemService.saveCartItem(updatedCartItem);

            return ResponseEntity.ok(mapToCartItemResponse(savedCartItem));
        }

        cartItem.setUser(user.get());
        cartItem.setProduct(product.get());
        CartItem savedCartItem = cartItemService.saveCartItem(cartItem);

        return ResponseEntity.ok(mapToCartItemResponse(savedCartItem));
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateCartItemQuantity(
            @PathVariable Long cartItemId,
            @RequestBody Integer newQuantity) {

        if (newQuantity <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Optional<CartItem> cartItemOptional = cartItemService.findById(cartItemId);

        if (cartItemOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CartItem cartItem = cartItemOptional.get();
        cartItem.setQuantity(newQuantity);
        CartItem updatedCartItem = cartItemService.saveCartItem(cartItem);

        return ResponseEntity.ok(mapToCartItemResponse(updatedCartItem));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<CartItemResponse>> getCartItems(@PathVariable Long userId) {
        Optional<User> user = userService.findById(userId);
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        List<CartItem> cartItems = cartItemService.getCartItemsByUserId(userId);

        List<CartItemResponse> responses = cartItems.stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> deleteCartItem(@PathVariable Long cartItemId) {
        Optional<CartItem> cartItem = cartItemService.findById(cartItemId);
        if (cartItem.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        cartItemService.deleteCartItem(cartItem.get());
        return ResponseEntity.noContent().build();
    }

    private CartItemResponse mapToCartItemResponse(CartItem cartItem) {
        return new CartItemResponse(
                cartItem.getId(),
                new UserDto(
                        cartItem.getUser().getId(),
                        cartItem.getUser().getUsername(),
                        cartItem.getUser().getEmail()
                ),
                new ProductDto(
                        cartItem.getProduct().getId(),
                        cartItem.getProduct().getName(),
                        cartItem.getProduct().getPrice(),
                        cartItem.getProduct().getDescription(),
                        cartItem.getProduct().getCategory(),
                        cartItem.getProduct().getImageUrl()
                ),
                cartItem.getQuantity()
        );
    }
}

