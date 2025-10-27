package com.attire.back.service;

import com.attire.back.model.CartItem;
import com.attire.back.repository.CartItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CartItemService {

    @Autowired
    private CartItemRepository cartItemRepository;

    public List<CartItem> getCartItemsByUserId(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    public CartItem saveCartItem(CartItem cartItem) {
        return cartItemRepository.save(cartItem);
    }

    public void deleteCartItemsByUserId(Long userId) {
        List<CartItem> cartItems = getCartItemsByUserId(userId);
        for (CartItem cartItem : cartItems) {
            cartItemRepository.delete(cartItem);
        }
    }

    public void deleteCartItem(CartItem cartItem) {
        cartItemRepository.delete(cartItem);
    }

    public Optional<CartItem> findById(Long id) {
        return cartItemRepository.findById(id);
    }

    public Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId) {
        return cartItemRepository.findByUserIdAndProductId(userId, productId);
    }
}
