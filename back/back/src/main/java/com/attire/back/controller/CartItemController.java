package com.attire.back.controller;

import com.attire.back.dto.AddToCartRequest;
import com.attire.back.dto.CartItemResponse;
import com.attire.back.dto.ProductDto;
import com.attire.back.dto.UserDto; // <--- Убедись, что UserDto импортирован
import com.attire.back.model.CartItem;
import com.attire.back.model.Product;
import com.attire.back.model.User;
import com.attire.back.service.CartItemService;
import com.attire.back.service.ProductService;
import com.attire.back.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder; // <--- Убедись, что Builder импортирован

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

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CartItemResponse>> getCartItemsByUserId(@PathVariable Long userId) {
        List<CartItem> cartItems = cartItemService.getCartItemsByUserId(userId);
        List<CartItemResponse> cartItemResponses = cartItems.stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cartItemResponses);
    }

    @PostMapping
    public ResponseEntity<CartItemResponse> addCartItem(@RequestBody AddToCartRequest request) { // <--- ИЗМЕНЕНИЕ ЗДЕСЬ

        Optional<User> userOptional = userService.findById(request.getUserId());
        Optional<Product> productOptional = productService.findById(request.getProductId());
        Integer quantity = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;

        if (userOptional.isPresent() && productOptional.isPresent()) {
            User user = userOptional.get();
            Product product = productOptional.get();

            Optional<CartItem> existingCartItem = cartItemService.findByUserIdAndProductId(request.getUserId(), request.getProductId());
            CartItem cartItem;
            if (existingCartItem.isPresent()) {
                cartItem = existingCartItem.get();
                cartItem.setQuantity(cartItem.getQuantity() + quantity);
            } else {
                cartItem = new CartItem(user, product, quantity);
            }

            CartItem savedCartItem = cartItemService.saveCartItem(cartItem);

            return new ResponseEntity<>(mapToCartItemResponse(savedCartItem), HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateCartItem(
            @PathVariable Long cartItemId,
            @RequestBody Integer quantity) {

        if (quantity == null || quantity <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Optional<CartItem> cartItemOptional = cartItemService.findById(cartItemId);
        if (cartItemOptional.isPresent()) {
            CartItem cartItem = cartItemOptional.get();
            cartItem.setQuantity(quantity);
            CartItem updatedCartItem = cartItemService.saveCartItem(cartItem);
            return ResponseEntity.ok(mapToCartItemResponse(updatedCartItem));
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> deleteCartItem(@PathVariable Long cartItemId) {
        cartItemService.deleteCartItem(cartItemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartItemService.deleteCartItemsByUserId(userId);
        return ResponseEntity.noContent().build();
    }

    private CartItemResponse mapToCartItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        User user = cartItem.getUser();

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
                product.getPrice(),
                product.getDescription(),
                product.getCategory(),
                imageUrl
        );

        UserDto userDto = new UserDto(user.getId(), user.getUsername(), user.getEmail());

        return new CartItemResponse(
                cartItem.getId(),
                userDto,
                productDto,
                cartItem.getQuantity()
        );
    }
}