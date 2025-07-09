#!/usr/bin/env python3
"""
GUI Calculator using tkinter
"""

import tkinter as tk
from tkinter import messagebox

class Calculator:
    def __init__(self, root):
        self.root = root
        self.root.title("Calculator")
        self.root.geometry("300x400")
        
        self.result_var = tk.StringVar()
        self.result_var.set("0")
        
        self.create_widgets()
    
    def create_widgets(self):
        # Display
        display = tk.Entry(self.root, textvariable=self.result_var, 
                          font=("Arial", 16), justify="right", state="readonly")
        display.grid(row=0, column=0, columnspan=4, padx=5, pady=5, sticky="ew")
        
        # Buttons
        buttons = [
            ('C', 1, 0), ('±', 1, 1), ('%', 1, 2), ('/', 1, 3),
            ('7', 2, 0), ('8', 2, 1), ('9', 2, 2), ('*', 2, 3),
            ('4', 3, 0), ('5', 3, 1), ('6', 3, 2), ('-', 3, 3),
            ('1', 4, 0), ('2', 4, 1), ('3', 4, 2), ('+', 4, 3),
            ('0', 5, 0), ('.', 5, 2), ('=', 5, 3)
        ]
        
        for (text, row, col) in buttons:
            if text == '0':
                btn = tk.Button(self.root, text=text, font=("Arial", 14),
                               command=lambda t=text: self.button_click(t))
                btn.grid(row=row, column=col, columnspan=2, padx=2, pady=2, sticky="ew")
            else:
                btn = tk.Button(self.root, text=text, font=("Arial", 14),
                               command=lambda t=text: self.button_click(t))
                btn.grid(row=row, column=col, padx=2, pady=2, sticky="ew")
        
        # Configure grid weights
        for i in range(4):
            self.root.grid_columnconfigure(i, weight=1)
    
    def button_click(self, char):
        current = self.result_var.get()
        
        if char == 'C':
            self.result_var.set("0")
        elif char == '=':
            try:
                result = eval(current)
                self.result_var.set(str(result))
            except:
                messagebox.showerror("Error", "Invalid expression")
                self.result_var.set("0")
        elif char == '±':
            if current != "0":
                if current.startswith('-'):
                    self.result_var.set(current[1:])
                else:
                    self.result_var.set('-' + current)
        else:
            if current == "0":
                self.result_var.set(char)
            else:
                self.result_var.set(current + char)

if __name__ == "__main__":
    root = tk.Tk()
    app = Calculator(root)
    root.mainloop()
