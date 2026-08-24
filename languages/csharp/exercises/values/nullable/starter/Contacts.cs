// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
namespace Exercise;

/// <summary>A contact: a name, and everything else optional.</summary>
public record Contact(string Name, string? Email, string? Phone, string? Address);

public static class Contacts
{
    public static string Display(Contact contact)
    {
        throw new NotImplementedException();
    }

    public static string BestChannel(Contact contact)
    {
        throw new NotImplementedException();
    }

    public static int Reachable(IEnumerable<Contact> contacts)
    {
        throw new NotImplementedException();
    }

    public static string Initials(Contact contact)
    {
        throw new NotImplementedException();
    }
}
